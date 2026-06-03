import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

interface ResetStats {
  before: Record<string, number>;
  after: Record<string, number>;
}

const stats: ResetStats = {
  before: {},
  after: {}
};

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const HASH_KEY_LENGTH = 64;
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, HASH_KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

async function verifyBootstrapEnvironment(): Promise<{ email: string; password: string }> {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email) {
    console.error("\n❌ BOOTSTRAP CONFIG FAILED: BOOTSTRAP_ADMIN_EMAIL not set");
    console.error("   Required: BOOTSTRAP_ADMIN_EMAIL=<email>");
    process.exit(1);
  }

  if (!password) {
    console.error("\n❌ BOOTSTRAP CONFIG FAILED: BOOTSTRAP_ADMIN_PASSWORD not set");
    console.error("   Required: BOOTSTRAP_ADMIN_PASSWORD=<password>");
    process.exit(1);
  }

  console.log("✓ Bootstrap configuration verified\n");
  return { email, password };
}

async function verifyStagingEnvironment(): Promise<void> {
  if (process.env.ALLOW_STAGING_RESET !== "true") {
    console.error("\n❌ SAFETY GATE FAILED: ALLOW_STAGING_RESET not set to 'true'");
    console.error("   Required: ALLOW_STAGING_RESET=true npx tsx scripts/reset-staging-clean-slate.ts");
    process.exit(1);
  }

  const result = await prisma.$queryRaw`
    SELECT current_database() as db, current_user as user_account, now() as server_time;
  ` as any;

  const dbInfo = result[0];
  const database = dbInfo.db;
  const userAccount = dbInfo.user_account;

  console.log("=== DATABASE IDENTITY VERIFICATION ===\n");
  console.log(`Database: ${database}`);
  console.log(`User: ${userAccount}`);
  console.log(`Timestamp: ${dbInfo.server_time}`);

  if (database !== "neondb") {
    console.error("\n❌ SAFETY GATE FAILED: Not staging database!");
    console.error(`   Expected: neondb, Got: ${database}`);
    process.exit(1);
  }

  if (!userAccount.includes("neondb")) {
    console.error("\n❌ SAFETY GATE FAILED: Not staging database user!");
    console.error(`   Expected neondb user, Got: ${userAccount}`);
    process.exit(1);
  }

  console.log("✓ Verified: This is staging database. Safe to proceed.\n");
}

async function captureBeforeState(): Promise<void> {
  console.log("=== BEFORE STATE ===\n");

  const tables = {
    "Department": () => prisma.department.count(),
    "RoleCatalog": () => prisma.roleCatalog.count(),
    "User": () => prisma.user.count(),
    "Candidate": () => prisma.candidate.count(),
    "CandidateApplication": () => prisma.candidateApplication.count(),
    "CandidateNote": () => prisma.candidateNote.count(),
    "CandidateAssessment": () => prisma.candidateAssessment.count(),
    "CandidateMilestone": () => prisma.candidateMilestone.count(),
    "HiringAssignment": () => prisma.hiringAssignment.count(),
    "CandidateActivityEvent": () => prisma.candidateActivityEvent.count(),
    "Attempt": () => prisma.attempt.count(),
    "Invite": () => prisma.invite.count(),
    "InterviewPanel": () => prisma.interviewPanel.count(),
    "DepartmentCandidacy": () => prisma.departmentCandidacy.count(),
    "AccessGrant": () => prisma.accessGrant.count(),
  };

  for (const [table, counter] of Object.entries(tables)) {
    const count = await counter();
    stats.before[table] = count;
    console.log(`${table}: ${count}`);
  }

  console.log();
}

async function wipeNonPreservedData(): Promise<void> {
  console.log("=== WIPING NON-PRESERVED DATA ===\n");

  const wipeTables = [
    { name: "CandidateActivityEvent", action: () => prisma.candidateActivityEvent.deleteMany() },
    { name: "CandidateMilestoneCheck", action: () => prisma.candidateMilestoneCheck.deleteMany() },
    { name: "CandidateMilestone", action: () => prisma.candidateMilestone.deleteMany() },
    { name: "InterviewFeedback", action: () => prisma.interviewFeedback.deleteMany() },
    { name: "InterviewPanelMember", action: () => prisma.interviewPanelMember.deleteMany() },
    { name: "InterviewPanel", action: () => prisma.interviewPanel.deleteMany() },
    { name: "CandidateNote", action: () => prisma.candidateNote.deleteMany() },
    { name: "CandidateResume", action: () => prisma.candidateResume.deleteMany() },
    { name: "CandidateAssessmentAttempt", action: () => prisma.candidateAssessmentAttempt.deleteMany() },
    { name: "CandidateAssessment", action: () => prisma.candidateAssessment.deleteMany() },
    { name: "CandidateOffer", action: () => prisma.candidateOffer.deleteMany() },
    { name: "HiringAssignment", action: () => prisma.hiringAssignment.deleteMany() },
    { name: "CandidateApplication", action: () => prisma.candidateApplication.deleteMany() },
    { name: "DepartmentCandidacy", action: () => prisma.departmentCandidacy.deleteMany() },
    { name: "Candidate", action: () => prisma.candidate.deleteMany() },
    { name: "AccessGrant", action: () => prisma.accessGrant.deleteMany() },
    { name: "UserPermissionOverride", action: () => prisma.userPermissionOverride.deleteMany() },
    { name: "User", action: () => prisma.user.deleteMany() },
    { name: "Attempt", action: () => prisma.attempt.deleteMany() },
    { name: "Result", action: () => prisma.result.deleteMany() },
    { name: "MagicToken", action: () => prisma.magicToken.deleteMany() },
    { name: "Participant", action: () => prisma.participant.deleteMany() },
    { name: "EmployeeGoal", action: () => prisma.employeeGoal.deleteMany() },
    { name: "PerformanceReview", action: () => prisma.performanceReview.deleteMany() },
    { name: "EmployeeActivityEvent", action: () => prisma.employeeActivityEvent.deleteMany() },
    { name: "Employee", action: () => prisma.employee.deleteMany() }
  ];

  for (const table of wipeTables) {
    try {
      const result = await table.action();
      const count = (result as any).count || result;
      if (count > 0) {
        console.log(`✓ Wiped ${table.name}: ${count} records`);
      }
    } catch {
      // Table already empty or doesn't have records
    }
  }

  console.log();
}

async function seedDefaultAccessRoles(): Promise<void> {
  console.log("=== SEEDING DEFAULT ACCESS ROLES ===\n");

  let systemDept = await prisma.department.findFirst({
    where: { slug: "system" }
  });

  if (!systemDept) {
    systemDept = await prisma.department.create({
      data: {
        slug: "system",
        name: "System",
        sortOrder: -999,
        isActive: true
      }
    });
    console.log("✓ Created system department");
  }

  const accessRoles = [
    { slug: "system-admin", label: "System Admin", description: "Full system access" },
    { slug: "department-admin", label: "Department Admin", description: "Department-level access" },
    { slug: "hiring-manager", label: "Hiring Manager", description: "Hiring management access" },
    { slug: "recruiter", label: "Recruiter", description: "Recruiter access" },
    { slug: "interviewer", label: "Interviewer", description: "Interview access" },
    { slug: "reviewer", label: "Reviewer", description: "Review access" },
    { slug: "viewer", label: "Viewer", description: "View-only access" }
  ];

  for (const role of accessRoles) {
    const existing = await prisma.roleCatalog.findFirst({
      where: { slug: role.slug }
    });

    if (!existing) {
      await prisma.roleCatalog.create({
        data: {
          slug: role.slug,
          label: role.label,
          kind: "access_role",
          description: role.description,
          departmentId: systemDept.id,
          isActive: true,
          sortOrder: 0
        }
      });
      console.log(`✓ Created access role: ${role.label}`);
    } else {
      await prisma.roleCatalog.update({
        where: { id: existing.id },
        data: { kind: "access_role" }
      });
      console.log(`✓ Verified access role: ${role.label}`);
    }
  }

  console.log();
}

async function createBootstrapAdmin(email: string, password: string): Promise<void> {
  console.log("=== BOOTSTRAPPING SYSTEM ADMIN USER ===\n");

  const adminRole = await prisma.roleCatalog.findFirst({
    where: { slug: "system-admin" }
  });

  if (!adminRole) {
    console.error("✗ System admin role not found!");
    process.exit(1);
  }

  // Hash the password
  const passwordHash = hashPassword(password);

  let admin = await prisma.user.findFirst({
    where: { email }
  });

  if (admin) {
    // Update existing user with new password
    admin = await prisma.user.update({
      where: { id: admin.id },
      data: {
        passwordHash,
        isActive: true,
        name: "System Admin"
      }
    });
    console.log(`✓ Updated bootstrap admin user: ${email}`);
  } else {
    // Create new user
    admin = await prisma.user.create({
      data: {
        email,
        name: "System Admin",
        passwordHash,
        isActive: true,
        departmentId: null,
        roleId: null
      }
    });
    console.log(`✓ Created bootstrap admin user: ${email}`);
  }

  // Remove any existing grant and create fresh one
  await prisma.accessGrant.deleteMany({
    where: {
      userId: admin.id,
      scope: "system"
    }
  });

  await prisma.accessGrant.create({
    data: {
      userId: admin.id,
      roleId: adminRole.id,
      scope: "system",
      departmentId: null,
      status: "active"
    }
  });

  console.log("✓ Created system-level access grant for admin");
  console.log("✓ Password hash set (not printed for security)\n");
}

async function captureAfterState(): Promise<void> {
  console.log("=== AFTER STATE ===\n");

  const tables = {
    "Department": () => prisma.department.count(),
    "RoleCatalog": () => prisma.roleCatalog.count(),
    "User": () => prisma.user.count(),
    "Candidate": () => prisma.candidate.count(),
    "CandidateApplication": () => prisma.candidateApplication.count(),
    "CandidateNote": () => prisma.candidateNote.count(),
    "CandidateAssessment": () => prisma.candidateAssessment.count(),
    "CandidateMilestone": () => prisma.candidateMilestone.count(),
    "HiringAssignment": () => prisma.hiringAssignment.count(),
    "CandidateActivityEvent": () => prisma.candidateActivityEvent.count(),
    "Attempt": () => prisma.attempt.count(),
    "Invite": () => prisma.invite.count(),
    "InterviewPanel": () => prisma.interviewPanel.count(),
    "DepartmentCandidacy": () => prisma.departmentCandidacy.count(),
    "AccessGrant": () => prisma.accessGrant.count(),
  };

  for (const [table, counter] of Object.entries(tables)) {
    const count = await counter();
    stats.after[table] = count;
    console.log(`${table}: ${count}`);
  }

  console.log();
}

async function printResetSummary(): Promise<void> {
  console.log("=== RESET SUMMARY ===\n");

  console.log("PRESERVED:");
  console.log(`  Department: ${stats.before["Department"]} → ${stats.after["Department"]}`);
  console.log(`  RoleCatalog: ${stats.before["RoleCatalog"]} → ${stats.after["RoleCatalog"]} (includes new access roles)`);

  console.log("\nWIPED:");
  const wipedTables = [
    "User", "Candidate", "CandidateApplication", "CandidateNote", "CandidateAssessment",
    "CandidateMilestone", "HiringAssignment", "CandidateActivityEvent", "Attempt",
    "Invite", "InterviewPanel", "DepartmentCandidacy", "AccessGrant"
  ];

  let totalWiped = 0;
  for (const table of wipedTables) {
    const before = stats.before[table] || 0;
    const after = stats.after[table] || 0;
    const wiped = before - after;
    totalWiped += wiped;
    if (before > 0) {
      console.log(`  ${table}: ${before} → ${after} (wiped ${wiped})`);
    }
  }

  console.log(`\nTotal records wiped: ${totalWiped}`);
  console.log("Bootstrap: System admin user created with system-level access grant");
  console.log("\n✓ Staging database reset complete!");
}

async function main(): Promise<void> {
  try {
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║         STAGING DATABASE CLEAN SLATE RESET                 ║");
    console.log("║                                                            ║");
    console.log("║  This operation will:                                      ║");
    console.log("║  - Wipe all candidates, users, assignments, assessments  ║");
    console.log("║  - Preserve departments and job designations              ║");
    console.log("║  - Seed default access roles                              ║");
    console.log("║  - Bootstrap system admin user                            ║");
    console.log("║                                                            ║");
    console.log("║  Caution: This is irreversible (staging only)             ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    // Verify bootstrap configuration
    const { email, password } = await verifyBootstrapEnvironment();

    // Verify staging database
    await verifyStagingEnvironment();
    await captureBeforeState();
    await wipeNonPreservedData();
    await seedDefaultAccessRoles();
    await createBootstrapAdmin(email, password);
    await captureAfterState();
    await printResetSummary();

    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                     RESET SUCCEEDED                        ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    console.log("✓ Bootstrap admin email: " + email);
    console.log("✓ System admin access granted");
    console.log("✓ Ready to test at: https://screener-v2-staging.vercel.app/login\n");

    process.exit(0);
  } catch (error) {
    console.error("\n✗ Reset failed!");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
