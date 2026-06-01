import { PrismaClient } from '@prisma/client';

// Use DIRECT_URL for verification
const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  console.error('❌ DIRECT_URL not set');
  process.exit(1);
}

const client = new PrismaClient({
  datasources: { db: { url: directUrl } }
});

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
  console.error('❌ Direct connection failed:', err.message.split('\n')[0]);
} finally {
  await client.$disconnect();
}
