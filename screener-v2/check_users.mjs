import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    roleId: true,
    role: { select: { label: true } }
  },
  orderBy: { email: "asc" }
});

console.log("Users and Roles:");
users.forEach(u => {
  console.log(`  ${u.email} (${u.name}): ${u.role?.label || "NO ROLE"}`);
});

await prisma.$disconnect();
