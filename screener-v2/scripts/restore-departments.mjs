import { PrismaClient } from '@prisma/client';

// Production database URL (using DIRECT_URL)
const prodDb = "postgresql://neondb_owner:npg_vV9Awx5KMLIc@ep-royal-bread-a4dwjaff.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Staging database URL
const stagingDb = "postgresql://neondb_owner:npg_vV9Awx5KMLIc@ep-proud-flower-a4kyww7v-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prismaProd = new PrismaClient({
  datasources: {
    db: {
      url: prodDb
    }
  }
});

const prismaStaging = new PrismaClient({
  datasources: {
    db: {
      url: stagingDb
    }
  }
});

async function restoreDepartments() {
  try {
    console.log('Fetching departments from production...');
    const departments = await prismaProd.department.findMany();
    console.log(`Found ${departments.length} departments in production`);

    if (departments.length === 0) {
      console.log('No departments to restore');
      return;
    }

    console.log('\nRestoring departments to staging...');
    for (const dept of departments) {
      try {
        await prismaStaging.department.upsert({
          where: { id: dept.id },
          update: {
            slug: dept.slug,
            name: dept.name,
            isActive: dept.isActive,
            sortOrder: dept.sortOrder,
          },
          create: {
            id: dept.id,
            slug: dept.slug,
            name: dept.name,
            isActive: dept.isActive,
            sortOrder: dept.sortOrder,
            createdAt: dept.createdAt,
            updatedAt: dept.updatedAt,
          },
        });
        console.log(`  ✓ Restored department: ${dept.name} (${dept.slug})`);
      } catch (error) {
        console.error(`  ✗ Error restoring department ${dept.id}:`, error.message);
      }
    }

    console.log(`\n✓ Restored ${departments.length} departments to staging`);
  } catch (error) {
    console.error('Restoration failed:', error);
  } finally {
    await prismaProd.$disconnect();
    await prismaStaging.$disconnect();
  }
}

restoreDepartments();
