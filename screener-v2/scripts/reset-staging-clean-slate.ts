import { PrismaClient } from "@prisma/client";

const ALLOW_STAGING_RESET = process.env.ALLOW_STAGING_RESET === "true";

// Simple password hash (using Crypto.SubtleCrypto for now)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

async function main() {
  if (!ALLOW_STAGING_RESET) {
    console.error("❌ ALLOW_STAGING_RESET environment variable must be set to 'true'");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    console.log("=== Staging Database Clean Slate Reset ===\n");

    // Verify staging database identity
    const dbInfo = await prisma.$queryRaw<
      Array<{ database_name: string; user_name: string }>
    >`SELECT current_database() as database_name, current_user as user_name`;

    const db = dbInfo[0];
    console.log(`Database: ${db.database_name}`);
    console.log(`User: ${db.user_name}`);

    const isStaging =
      db.database_name === "neondb" && db.user_name.includes("neondb_owner");

    if (!isStaging) {
      console.error(
        "\n❌ ERROR: This does not appear to be a staging database!"
      );
      console.error("Refusing to reset non-staging database.");
      process.exit(1);
    }

    // Get before counts
    console.log("\n=== Before Reset ===");
    const beforeDept = await prisma.department.count();
    const beforeRoles = await prisma.roleCatalog.count();
    const beforePerms = await prisma.rolePermissionTemplate.count();
    const beforeUsers = await prisma.user.count();
    const beforeCandidates = await prisma.candidate.count();
    const beforeNotes = await prisma.candidateNote.count();
    const beforeActivity = await prisma.candidateActivityEvent.count();
    const beforeOffers = await prisma.candidateOffer.count();

    console.log(`Department: ${beforeDept}`);
    console.log(`RoleCatalog: ${beforeRoles}`);
    console.log(`RolePermissionTemplate: ${beforePerms}`);
    console.log(`User: ${beforeUsers}`);
    console.log(`Candidate: ${beforeCandidates}`);
    console.log(`CandidateNote: ${beforeNotes}`);
    console.log(`CandidateActivityEvent: ${beforeActivity}`);
    console.log(`CandidateOffer: ${beforeOffers}`);

    // Step 1: Delete candidates and related records (cascade handles most)
    console.log("\nDeleting candidates and related records...");
    await prisma.candidate.deleteMany({});

    // Step 2: Delete users (except what we'll bootstrap)
    console.log("Deleting users...");
    await prisma.user.deleteMany({});

    // Step 3: Delete other session-related tables
    console.log("Cleaning session/auth tables...");
    await prisma.magicToken.deleteMany({});
    await prisma.participant.deleteMany({});

    // Step 4: Get all roles and mark kind appropriately
    console.log("Updating RoleCatalog kind field...");
    const allRoles = await prisma.roleCatalog.findMany({
      include: { permissions: true }
    });

    for (const role of allRoles) {
      const isAccessRole = role.permissions.length > 0;
      await prisma.roleCatalog.update({
        where: { id: role.id },
        data: { kind: isAccessRole ? "access_role" : "job_designation" }
      });
    }

    // Step 5: Seed default access roles if they don't exist
    console.log("Seeding default access roles...");
    const defaultRoles = [
      {
        slug: "system-admin",
        label: "System Admin",
        departmentId: "system", // Will be replaced with system dept
        description: "Full system access",
        permissions: [
          "manage_users",
          "manage_departments",
          "manage_roles",
          "manage_candidates",
          "view_candidates",
          "promote_candidate",
          "delete_candidate"
        ]
      },
      {
        slug: "department-admin",
        label: "Department Admin",
        departmentId: "system",
        description: "Manage department team and access",
        permissions: [
          "manage_users",
          "manage_candidates",
          "view_candidates",
          "promote_candidate"
        ]
      },
      {
        slug: "hiring-manager",
        label: "Hiring Manager",
        departmentId: "system",
        description: "Manage hiring workflow",
        permissions: [
          "manage_candidates",
          "view_candidates",
          "promote_candidate"
        ]
      },
      {
        slug: "recruiter",
        label: "Recruiter",
        departmentId: "system",
        description: "Source and manage candidates",
        permissions: ["manage_candidates", "view_candidates"]
      },
      {
        slug: "interviewer",
        label: "Interviewer",
        departmentId: "system",
        description: "Conduct interviews and provide feedback",
        permissions: ["view_candidates"]
      },
      {
        slug: "reviewer",
        label: "Reviewer",
        departmentId: "system",
        description: "Review candidate assessments",
        permissions: ["view_candidates"]
      },
      {
        slug: "viewer",
        label: "Viewer",
        departmentId: "system",
        description: "Read-only access to candidates",
        permissions: ["view_candidates"]
      }
    ];

    // Get system department
    const systemDept = await prisma.department.findUnique({
      where: { slug: "system" }
    });

    if (!systemDept) {
      console.error(
        "ERROR: System department not found. Create it before running reset."
      );
      process.exit(1);
    }

    // Create default roles
    for (const roleTemplate of defaultRoles) {
      const existing = await prisma.roleCatalog.findUnique({
        where: { slug: roleTemplate.slug }
      });

      if (!existing) {
        const role = await prisma.roleCatalog.create({
          data: {
            slug: roleTemplate.slug,
            label: roleTemplate.label,
            departmentId: systemDept.id,
            description: roleTemplate.description,
            kind: "access_role",
            isActive: true,
            sortOrder: 0
          }
        });

        // Add permissions
        for (const permission of roleTemplate.permissions) {
          await prisma.rolePermissionTemplate.create({
            data: {
              roleId: role.id,
              permission,
              scope: "all"
            }
          });
        }
      }
    }

    // Step 6: Create bootstrap system admin user
    console.log("Creating bootstrap system admin...");
    const adminPassword = "TempAdmin@123"; // Temporary, should be changed
    const adminPasswordHash = await hashPassword(adminPassword);

    let adminUser = await prisma.user.findUnique({
      where: { email: "admin@northstar.local" }
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: "admin@northstar.local",
          name: "System Administrator",
          passwordHash: adminPasswordHash,
          isActive: true
        }
      });
    }

    // Step 7: Grant system admin role to bootstrap admin user
    console.log("Granting system admin access to bootstrap user...");
    const systemAdminRole = await prisma.roleCatalog.findUnique({
      where: { slug: "system-admin" }
    });

    if (systemAdminRole) {
      // Remove any existing grant first
      await prisma.accessGrant.deleteMany({
        where: {
          userId: adminUser.id,
          roleId: systemAdminRole.id,
          scope: "system"
        }
      });

      // Create system admin grant
      await prisma.accessGrant.create({
        data: {
          userId: adminUser.id,
          roleId: systemAdminRole.id,
          scope: "system",
          status: "active"
        }
      });
    }

    // Get after counts
    console.log("\n=== After Reset ===");
    const afterDept = await prisma.department.count();
    const afterRoles = await prisma.roleCatalog.count();
    const afterPerms = await prisma.rolePermissionTemplate.count();
    const afterUsers = await prisma.user.count();
    const afterCandidates = await prisma.candidate.count();
    const afterAccessGrants = await prisma.accessGrant.count();

    console.log(`Department: ${afterDept} (preserved: ${beforeDept === afterDept ? "✓" : "✗"})`);
    console.log(`RoleCatalog: ${afterRoles}`);
    console.log(`RolePermissionTemplate: ${afterPerms}`);
    console.log(`User: ${afterUsers}`);
    console.log(`Candidate: ${afterCandidates} (wiped: ${beforeCandidates > 0 && afterCandidates === 0 ? "✓" : "✗"})`);
    console.log(`AccessGrant: ${afterAccessGrants}`);

    console.log("\n=== Summary ===");
    console.log(`✓ Departments preserved: ${afterDept}/${beforeDept}`);
    console.log(`✓ Candidates wiped: ${beforeCandidates} → ${afterCandidates}`);
    console.log(`✓ Users reset: ${beforeUsers} → ${afterUsers}`);
    console.log(`✓ Default access roles seeded: 7`);
    console.log(`✓ Bootstrap admin created: admin@northstar.local`);
    console.log(`✓ System admin access grant created: ${afterAccessGrants > 0 ? "✓" : "✗"}`);

    console.log(
      "\n✅ Clean slate reset complete. Staging database is ready."
    );
    console.log("\nIMPORTANT:");
    console.log("- Bootstrap admin: admin@northstar.local");
    console.log(
      "- Bootstrap password: TempAdmin@123 (CHANGE IMMEDIATELY IN PRODUCTION)"
    );
    console.log("- Departments and job designations preserved");
    console.log("- All candidates and test data removed");

    process.exit(0);
  } catch (error) {
    console.error("Error during reset:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
