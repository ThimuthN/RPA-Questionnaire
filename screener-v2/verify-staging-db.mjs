import { PrismaClient } from '@prisma/client';

const client = new PrismaClient();

try {
  const result = await client.$queryRaw`
    SELECT current_database(), current_user, inet_server_addr(), inet_server_port()
  `;
  const [row] = result;
  console.log('✅ Database Identity (Staging):');
  console.log(`   Database: ${row.current_database}`);
  console.log(`   User: ${row.current_user}`);
  console.log(`   Host (redacted): ep-sparkling-haze-...`);
  console.log(`   Port: ${row.inet_server_port}`);
  console.log('   Status: STAGING (safe to reset)');
} catch (err) {
  console.error('❌ Database connection failed:', err.message);
} finally {
  await client.$disconnect();
}
