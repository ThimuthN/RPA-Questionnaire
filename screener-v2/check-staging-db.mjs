import { PrismaClient } from '@prisma/client';

const stagingDb = "postgresql://neondb_owner:npg_vV9Awx5KMLIc@ep-proud-flower-a4kyww7v-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: stagingDb
    }
  }
});

try {
  const tables = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log(`\n✓ Tables in staging database (ep-proud-flower):`);
  console.log(`  Total: ${tables.length} tables\n`);

  if (tables.length === 0) {
    console.log('  ⚠️ DATABASE IS EMPTY!');
  } else {
    tables.forEach(t => console.log(`  - ${t.table_name}`));
  }
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await prisma.$disconnect();
}
