import { PrismaClient } from '@prisma/client';

const stagingDb = "postgresql://neondb_owner:npg_vV9Awx5KMLIc@ep-proud-flower-a4kyww7v.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: stagingDb
    }
  }
});

async function checkSchema() {
  try {
    // Check if DepartmentCandidacy table exists
    const result = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\n✓ Tables in staging database:');
    const tableNames = result.map(t => t.table_name);
    tableNames.forEach(name => console.log(`  - ${name}`));

    const hasRefactored = {
      DepartmentCandidacy: tableNames.includes('DepartmentCandidacy'),
      RoleCatalog: tableNames.includes('RoleCatalog'),
      Department: tableNames.includes('Department'),
    };

    console.log('\n✓ Refactored schema status:');
    console.log(`  - DepartmentCandidacy table: ${hasRefactored.DepartmentCandidacy ? '✓' : '✗'}`);
    console.log(`  - RoleCatalog table: ${hasRefactored.RoleCatalog ? '✓' : '✗'}`);
    console.log(`  - Department table: ${hasRefactored.Department ? '✓' : '✗'}`);

    if (!hasRefactored.DepartmentCandidacy) {
      console.log('\n⚠ Staging database does NOT have refactored schema!');
      console.log('   Need to apply migrations to staging database.');
    } else {
      console.log('\n✓ Staging database has refactored schema! Ready for development.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
