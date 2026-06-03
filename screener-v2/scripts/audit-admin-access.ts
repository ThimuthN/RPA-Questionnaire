import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function auditAdmin() {
  const admin = await prisma.user.findUnique({
    where: { email: "tnayanapriya@innobothealth.com" },
    select: {
      id: true,
      email: true,
      isActive: true,
      departmentId: true,
      roleId: true,
      accessGrants: {
        where: { status: "active" },
        select: {
          id: true,
          scope: true,
          status: true,
          departmentId: true,
          department: { select: { id: true, slug: true, name: true } },
          role: {
            select: {
              id: true,
              slug: true,
              kind: true,
              label: true,
              permissions: { select: { permission: true } }
            }
          }
        }
      }
    }
  });

  console.log("=== ADMIN USER (tnayanapriya@innobothealth.com) ===\n");

  if (!admin) {
    console.log("USER NOT FOUND!");
    process.exit(1);
  }

  console.log(`User ID: ${admin.id}`);
  console.log(`Email: ${admin.email}`);
  console.log(`Active: ${admin.isActive}`);
  console.log(`Legacy DepartmentId: ${admin.departmentId || "null"}`);
  console.log(`Legacy RoleId: ${admin.roleId || "null"}`);

  console.log("\n=== ACCESSGRANTS (ACTIVE) ===\n");

  if (admin.accessGrants.length === 0) {
    console.log("NONE");
  } else {
    admin.accessGrants.forEach((g, i) => {
      console.log(`Grant ${i + 1}:`);
      console.log(`  ID: ${g.id.substring(0, 12)}...`);
      console.log(`  Scope: ${g.scope}`);
      console.log(`  Status: ${g.status}`);
      if (g.department) {
        console.log(`  Department: ${g.department.slug} (${g.department.name})`);
      } else {
        console.log(`  Department: SYSTEM (null)`);
      }
      console.log(`  Role: ${g.role.label}`);
      console.log(`    - Slug: ${g.role.slug}`);
      console.log(`    - Kind: ${g.role.kind}`);
      console.log(`    - Permissions: ${g.role.permissions.length}`);
      if (g.role.permissions.length > 0) {
        g.role.permissions.slice(0, 8).forEach(p => {
          console.log(`      * ${p.permission}`);
        });
        if (g.role.permissions.length > 8) {
          console.log(`      ... and ${g.role.permissions.length - 8} more`);
        }
      }
    });
  }

  console.log("\n=== DEPARTMENTS (First 5) ===\n");
  const depts = await prisma.department.findMany({
    select: { id: true, slug: true, name: true, isActive: true },
    orderBy: { sortOrder: "asc" },
    take: 5
  });
  depts.forEach(d => {
    console.log(`  ${d.slug}: ${d.name} (${d.id.substring(0, 8)}..., active: ${d.isActive})`);
  });

  const deptTotal = await prisma.department.count();
  console.log(`\nTotal Departments: ${deptTotal}`);

  const oldAdmin = await prisma.user.findFirst({
    where: { email: "admin@northstar.local" }
  });
  console.log(`\nadmin@northstar.local exists: ${oldAdmin ? "YES (CLEANUP NEEDED)" : "NO ✓"}`);

  await prisma.$disconnect();
}

auditAdmin().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
