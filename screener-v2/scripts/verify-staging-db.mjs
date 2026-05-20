import { PrismaClient } from '@prisma/client';

const stagingDb = "postgresql://neondb_owner:npg_vV9Awx5KMLIc@ep-proud-flower-a4kyww7v-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: stagingDb
    }
  }
});

async function verifyStagingData() {
  try {
    const candidates = await prisma.candidate.count();
    const users = await prisma.user.count();
    const departments = await prisma.department.count();

    console.log(`\n✓ Staging Database Status:`);
    console.log(`  - Candidates: ${candidates}`);
    console.log(`  - Users: ${users}`);
    console.log(`  - Departments: ${departments}`);

    if (candidates > 0 && users > 0 && departments > 0) {
      console.log(`\n✓ Staging database is fully populated and ready for testing!\n`);
    } else {
      console.log(`\n⚠ Some data is missing:\n`);
      if (candidates === 0) console.log(`  - No candidates found`);
      if (users === 0) console.log(`  - No users found`);
      if (departments === 0) console.log(`  - No departments found`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyStagingData();
