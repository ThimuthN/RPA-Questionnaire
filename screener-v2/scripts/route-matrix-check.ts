import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkRoutes() {
  // Get a test department
  const testDept = await prisma.department.findFirst({
    where: { isActive: true, slug: { not: "system" } },
    select: { id: true, slug: true, name: true }
  });

  if (!testDept) {
    console.log("No test department found!");
    process.exit(1);
  }

  console.log(`Testing department: ${testDept.slug} (ID: ${testDept.id})\n`);

  // Test 1: getDepartment(id) — does it return the department?
  console.log("=== getDepartment() ===");
  console.log(`Input ID: ${testDept.id}`);
  const deptById = await prisma.department.findUnique({
    where: { id: testDept.id }
  });
  console.log(`Result by ID: ${deptById ? "✓ FOUND" : "✗ NOT FOUND"}`);

  const deptBySlug = await prisma.department.findUnique({
    where: { slug: testDept.slug }
  });
  console.log(`Result by slug: ${deptBySlug ? "✓ FOUND" : "✗ NOT FOUND"}`);

  // Test 2: Admin AccessGrant scope
  console.log("\n=== Admin AccessGrant Analysis ===");
  const admin = await prisma.user.findUnique({
    where: { email: "tnayanapriya@innobothealth.com" },
    select: {
      id: true,
      accessGrants: {
        where: { status: "active" },
        select: {
          scope: true,
          role: { select: { slug: true } }
        }
      }
    }
  });

  if (!admin || admin.accessGrants.length === 0) {
    console.log("Admin not found or has no accessgrants!");
    process.exit(1);
  }

  const grant = admin.accessGrants[0];
  console.log(`Role: ${grant.role.slug}`);
  console.log(`Scope: ${grant.scope}`);
  console.log(`Can access this department: ${grant.scope === "system" ? "✓ YES (system scope)" : "? UNCLEAR"}`);

  // Test 3: Required permissions for each route
  console.log("\n=== Route Permission Matrix ===");

  const permissions = {
    "/departments/[id]": "none (overview)",
    "/departments/[id]/jobs": "create_job",
    "/departments/[id]/applicants": "manage_candidates",
    "/departments/[id]/candidates": "view_candidates",
    "/departments/[id]/assessments": "create_assessment",
    "/departments/[id]/users": "manage_users",
    "/departments/[id]/access": "manage_users",
    "/departments/[id]/designations": "manage_roles"
  };

  console.log("\nAdmin permissions:");
  admin.accessGrants[0] &&
    (await prisma.roleCatalog.findFirst({
      where: { slug: "system-admin" },
      select: {
        permissions: { select: { permission: true } }
      }
    }))
      ?.permissions.forEach(p => {
        const routesNeed = Object.entries(permissions)
          .filter(([_, perm]) => perm === p.permission || perm.includes(p.permission))
          .map(([route]) => route);

        console.log(`  ${p.permission}: ${routesNeed.length > 0 ? routesNeed.join(", ") : "—"}`);
      });

  console.log("\nRoute requirements:");
  Object.entries(permissions).forEach(([route, perm]) => {
    console.log(`  ${route}: ${perm}`);
  });

  await prisma.$disconnect();
}

checkRoutes().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
