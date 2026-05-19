import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Get all roles and departments
const roles = await prisma.roleCatalog.findMany({
  select: { id: true, label: true, departmentId: true }
});

const depts = await prisma.department.findMany({
  select: { id: true, name: true, slug: true }
});

console.log("Roles:");
roles.forEach(r => {
  console.log(`  ${r.label}: ${r.departmentId || "NO DEPARTMENT"}`);
});

console.log("\nDepartments:");
depts.forEach(d => {
  console.log(`  ${d.name} (${d.slug}): ${d.id}`);
});

await prisma.$disconnect();
