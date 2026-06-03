import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testRoutes() {
  // Get test department
  const testDept = await prisma.department.findFirst({
    where: { isActive: true, slug: { not: "system" } },
    select: { id: true, slug: true, name: true }
  });

  if (!testDept) {
    console.log("No test department found!");
    process.exit(1);
  }

  const deptId = testDept.id;
  console.log(`\n=== TESTING DEPARTMENT: ${testDept.slug} (${deptId.substring(0, 8)}...) ===\n`);

  // Get admin user and their AccessGrant/permissions
  const admin = await prisma.user.findUnique({
    where: { email: "tnayanapriya@innobothealth.com" },
    select: {
      id: true,
      accessGrants: {
        where: { status: "active" },
        select: {
          scope: true,
          role: { select: { slug: true, permissions: { select: { permission: true } } } }
        }
      }
    }
  });

  if (!admin) {
    console.log("Admin user not found!");
    process.exit(1);
  }

  const adminId = admin.id;
  const isSystemAdmin = admin.accessGrants.some(g => g.scope === "system" && g.role.slug === "system-admin");
  const adminPermissions = new Set<string>();
  admin.accessGrants.forEach(g => {
    g.role.permissions.forEach(p => adminPermissions.add(p.permission));
  });

  console.log(`Admin ID: ${adminId.substring(0, 8)}...`);
  console.log(`Is System Admin: ${isSystemAdmin}`);
  console.log(`Permissions: ${Array.from(adminPermissions).join(", ")}`);

  // Test getDepartment
  console.log("\n=== PHASE 1: getDepartment(id) ===");
  const dept = await prisma.department.findUnique({ where: { id: deptId } });
  console.log(`Result: ${dept ? "✓ FOUND" : "✗ NOT FOUND"}`);

  // Test each route
  const routes = [
    { path: "/departments/[id]", permission: "none", pageGuard: "none" },
    { path: "/departments/[id]/jobs", permission: "create_job", pageGuard: "requirePermissionForDepartment" },
    { path: "/departments/[id]/applicants", permission: "manage_candidates", pageGuard: "requirePermissionForDepartment" },
    { path: "/departments/[id]/candidates", permission: "view_candidates", pageGuard: "requirePermissionForDepartment" },
    { path: "/departments/[id]/assessments", permission: "create_assessment", pageGuard: "requirePermissionForDepartment" },
    { path: "/departments/[id]/users", permission: "manage_users", pageGuard: "requirePermissionForDepartment" },
    { path: "/departments/[id]/access", permission: "manage_users", pageGuard: "requirePermissionForDepartment" },
    { path: "/departments/[id]/designations", permission: "manage_roles", pageGuard: "requirePermissionForDepartment" }
  ];

  console.log("\n=== PHASE 2: Layout Workspace Access Check ===");
  // All routes hit the layout: requireDepartmentWorkspaceAccess
  // This calls canAccessDepartmentWorkspace(session, departmentId)
  console.log(`Checking: canAccessDepartmentWorkspace(admin, ${testDept.slug})`);
  console.log(`  System admin? ${isSystemAdmin ? "✓ YES" : "✗ NO"}`);
  console.log(`  Same department? ${false} (admin has no legacy departmentId)`);
  console.log(`  Global permissions? Need to check...`);

  const globalPerms = ["manage_users", "create_job", "edit_job", "view_candidates", "manage_candidates"];
  const hasGlobalPerm = globalPerms.some(p => adminPermissions.has(p));
  console.log(`  Has global scope permission? ${hasGlobalPerm ? "✓ YES" : "✗ NO"}`);

  console.log("\n=== PHASE 3: Per-Route Permission Checks ===\n");

  routes.forEach(route => {
    console.log(`Route: ${route.path}`);
    console.log(`  Required permission: ${route.permission}`);
    console.log(`  Page guard: ${route.pageGuard}`);

    if (route.permission === "none") {
      console.log(`  Has permission? N/A (no permission required)`);
      console.log(`  Likely status: ✓ PASS (only layout check)`);
    } else {
      const hasPermission = adminPermissions.has(route.permission);
      console.log(`  Has permission? ${hasPermission ? "✓ YES" : "✗ NO"}`);
      console.log(`  Is system admin? ${isSystemAdmin ? "✓ YES (should bypass)" : "✗ NO"}`);

      if (isSystemAdmin) {
        console.log(`  Likely status: ${hasPermission ? "✓ PASS" : "? UNCLEAR (system admin bypass may fail if not implemented)"}`);
      } else {
        console.log(`  Likely status: ${hasPermission ? "✓ PASS" : "✗ FAIL"}`);
      }
    }
    console.log();
  });

  console.log("\n=== SUMMARY ===\n");
  console.log(`System admin with system-admin AccessGrant:`);
  console.log(`  Should pass ALL layout checks: ${isSystemAdmin ? "✓ YES" : "✗ NO"}`);
  console.log(`  Should pass permission checks: ${isSystemAdmin ? "✓ NEEDS IMPLEMENTATION" : "✗ NO"}`);
  console.log(`  Missing permissions: ${Array.from(["create_job", "create_assessment"].filter(p => !adminPermissions.has(p))).join(", ") || "none"}`);

  await prisma.$disconnect();
}

testRoutes().catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
