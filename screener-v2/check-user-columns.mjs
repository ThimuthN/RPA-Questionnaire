import { PrismaClient } from '@prisma/client';

const stagingDb = "postgresql://neondb_owner:npg_vV9Awx5KMLIc@ep-proud-flower-a4kyww7v-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient({
  datasources: { db: { url: stagingDb } }
});

try {
  const columns = await prisma.$queryRaw`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'User'
    ORDER BY ordinal_position
  `;

  console.log(`\n✓ User table columns in staging:`);
  console.log(`  Total: ${columns.length} columns\n`);
  columns.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));

  const hasRoleId = columns.some(c => c.column_name === 'roleId');
  console.log(`\n${hasRoleId ? '✅ roleId EXISTS' : '❌ roleId MISSING'}`);
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await prisma.$disconnect();
}
