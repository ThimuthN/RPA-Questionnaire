import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const depts = await prisma.department.findMany({
  select: { id: true, name: true, slug: true, isActive: true }
});

console.log(`Found ${depts.length} departments:`);
depts.forEach(d => {
  console.log(`  ${d.name} (${d.slug}): ${d.isActive ? "ACTIVE" : "INACTIVE"}`);
});

await prisma.$disconnect();
