import { prisma } from "../src/lib/db/prisma";
import { cleanupJobDesignationPermissionTemplates } from "../src/lib/roles/job-designation-permissions-cleanup";

async function main() {
  const apply = process.argv.includes("--apply");
  const result = await cleanupJobDesignationPermissionTemplates(prisma, { apply });

  if (!apply) {
    console.log(
      `[dry-run] Found ${result.matchingCount} RolePermissionTemplate row(s) attached to job designations. Re-run with --apply to delete them.`
    );
    return;
  }

  console.log(`Deleted ${result.deletedCount} RolePermissionTemplate row(s) attached to job designations.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
