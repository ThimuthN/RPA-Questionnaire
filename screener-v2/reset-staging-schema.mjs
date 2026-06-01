import { PrismaClient } from '@prisma/client';

const client = new PrismaClient();

async function resetSchema() {
  try {
    console.log('🔄 Resetting staging database schema...');
    
    // Drop public schema and recreate
    await client.$executeRawUnsafe('DROP SCHEMA public CASCADE;');
    console.log('  ✅ Dropped public schema');
    
    await client.$executeRawUnsafe('CREATE SCHEMA public;');
    console.log('  ✅ Created public schema');
    
    await client.$executeRawUnsafe('GRANT ALL ON SCHEMA public TO public;');
    console.log('  ✅ Granted permissions');
    
    console.log('\n✅ Schema reset complete. Ready for fresh migrations.');
  } catch (err) {
    console.error('❌ Schema reset failed:', err.message);
    process.exit(1);
  } finally {
    await client.$disconnect();
  }
}

resetSchema();
