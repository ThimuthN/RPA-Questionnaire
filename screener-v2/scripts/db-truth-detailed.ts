import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function dbTruth() {
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
          departmentId: true,
          status: true,
          role: {
            select: {
              slug: true,
              label: true,
              kind: true,
              permissions: { select: { permission: true } }
            }
          }
        }
      }
    }
  });

  console.log("=== BOOTSTRAP ADMIN ===\n");
  if (!admin) {
    console.log("NOT FOUND");
    process.exit(1);
  }

  console.log(`User ID: ${admin.id}`);
  console.log(`Email: ${admin.email}`);
  console.log(`IsActive: ${admin.isActive}`);
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
      console.log(`  DepartmentId: ${g.departmentId || "null (system)"}`);
      console.log(`  Status: ${g.status}`);
      console.log(`  Role Slug: ${g.role.slug}`);
      console.log(`  Role Label: ${g.role.label}`);
      console.log(`  Role Kind: ${g.role.kind}`);
      console.log(`  Permissions: ${g.role.permissions.length}`);
      g.role.permissions.slice(0, 5).forEach(p => console.log(`    - ${p.permission}`));
    });
  }

  const depts = await prisma.department.findMany({
    select: { id: true, slug: true, name: true },
    take: 5,
    orderBy: { sortOrder: "asc" }
  });

  console.log("\n=== FIRST 5 DEPARTMENTS ===\n");
  depts.forEach(d => console.log(`  ${d.slug}: ${d.name} (${d.id.substring(0, 8)}...)`));

  const deptCount = await prisma.department.count();
  console.log(`\nTotal: ${deptCount}`);

  const oldAdmin = await prisma.user.findUnique({
    where: { email: "admin@northstar.local" }
  });
  console.log(`\nadmin@northstar.local exists: ${oldAdmin ? "YES" : "NO"}`);

  await prisma.$disconnect();
}

dbTruth().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
