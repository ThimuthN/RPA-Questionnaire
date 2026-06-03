import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkRoleKinds() {
  console.log("=== ROLECATALOG.KIND DISTRIBUTION ===\n");

  const accessRoles = await prisma.roleCatalog.count({
    where: { kind: "access_role" }
  });
  const jobDesignations = await prisma.roleCatalog.count({
    where: { kind: "job_designation" }
  });

  console.log(`Access Roles (kind='access_role'): ${accessRoles}`);
  console.log(`Job Designations (kind='job_designation'): ${jobDesignations}`);
  console.log(`Total: ${accessRoles + jobDesignations}\n`);

  // Check AccessGrant count
  const grantCount = await prisma.accessGrant.count();
  console.log(`AccessGrant records: ${grantCount}`);

  // Check User count
  const userCount = await prisma.user.count();
  console.log(`User records: ${userCount}`);

  // List the bootstrap admin
  const bootstrapAdmin = await prisma.user.findFirst({
    where: { email: "tnayanapriya@innobothealth.com" }
  });

  if (bootstrapAdmin) {
    console.log(`\n✓ Bootstrap admin exists: ${bootstrapAdmin.email}`);
    console.log(`  Status: ${bootstrapAdmin.isActive ? "active" : "inactive"}`);
    console.log(`  Password hash set: ${bootstrapAdmin.passwordHash ? "yes" : "no"}`);
  } else {
    console.log("\n✗ Bootstrap admin not found!");
  }
}

checkRoleKinds()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
