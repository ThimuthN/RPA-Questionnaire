import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const stagingUrl = "postgresql://neondb_owner:npg_vV9Awx5KMLIc@ep-proud-flower-a4kyww7v.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function rebuildDatabase() {
  console.log('🔄 Starting staging database rebuild...\n');

  try {
    // Step 1: Drop all tables to reset database
    console.log('Step 1: Resetting database...');
    const prisma = new PrismaClient({
      datasources: { db: { url: stagingUrl } }
    });

    // Drop all tables
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS public CASCADE`);
    await prisma.$executeRawUnsafe(`CREATE SCHEMA public`);
    console.log('✓ Database reset\n');
    await prisma.$disconnect();

    // Step 2: Run migrations
    console.log('Step 2: Applying migrations...');
    process.env.DATABASE_URL = stagingUrl;
    process.env.DIRECT_URL = stagingUrl.replace('-pooler', '');

    const { stdout } = await execAsync('npx prisma migrate deploy', {
      cwd: process.cwd(),
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024
    });
    console.log('✓ Migrations applied\n');

    // Step 3: Verify schema
    console.log('Step 3: Verifying schema...');
    const prisma2 = new PrismaClient({
      datasources: { db: { url: stagingUrl } }
    });

    const tables = await prisma2.$queryRaw`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;

    console.log(`✓ Database has ${tables[0].count} tables\n`);
    await prisma2.$disconnect();

    console.log('✅ Database rebuild complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

rebuildDatabase();
