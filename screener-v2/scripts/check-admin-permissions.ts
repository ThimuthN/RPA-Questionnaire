import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAdminRole() {
  const systemAdminRole = await prisma.roleCatalog.findFirst({
    where: { slug: "system-admin" },
    include: {
      permissions: {
        select: { permission: true }
      }
    }
  });

  if (systemAdminRole) {
    console.log("System Admin Role found:");
    console.log("- ID:", systemAdminRole.id);
    console.log("- Label:", systemAdminRole.label);
    console.log("- Kind:", systemAdminRole.kind);
    console.log("- Permissions count:", systemAdminRole.permissions.length);
    if (systemAdminRole.permissions.length > 0) {
      console.log("- Sample permissions:", systemAdminRole.permissions.map(p => p.permission).slice(0, 5));
    } else {
      console.log("- NO PERMISSIONS SET!");
    }
  } else {
    console.log("System Admin Role not found!");
  }

  const bootstrapAdmin = await prisma.user.findFirst({
    where: { email: "tnayanapriya@innobothealth.com" },
    include: {
      accessGrants: {
        where: { status: "active" },
        include: {
          role: {
            include: {
              permissions: { select: { permission: true } }
            }
          }
        }
      }
    }
  });

  if (bootstrapAdmin) {
    console.log("\nBootstrap Admin found:");
    console.log("- Email:", bootstrapAdmin.email);
    console.log("- AccessGrants:", bootstrapAdmin.accessGrants.length);
    bootstrapAdmin.accessGrants.forEach(grant => {
      console.log("  - Role:", grant.role.label, `(${grant.role.permissions.length} permissions, scope=${grant.scope})`);
    });
  } else {
    console.log("Bootstrap Admin not found!");
  }
}

checkAdminRole()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
