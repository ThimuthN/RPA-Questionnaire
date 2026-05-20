import { PrismaClient } from '@prisma/client';

const stagingDb = "postgresql://neondb_owner:npg_vV9Awx5KMLIc@ep-proud-flower-a4kyww7v.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: stagingDb
    }
  }
});

async function fixSchema() {
  try {
    console.log('Checking if DepartmentCandidacy table exists...');

    // Check if table exists
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'DepartmentCandidacy'
      )
    `;

    if (!tableCheck[0].exists) {
      console.log('Creating DepartmentCandidacy table...');

      // Add orgStatus column if it doesn't exist
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "Candidate" ADD COLUMN "orgStatus" TEXT NOT NULL DEFAULT 'active'
        `);
        console.log('  ✓ Added orgStatus column');
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log('  ✓ orgStatus column already exists');
        } else {
          throw e;
        }
      }

      // Create DepartmentCandidacy table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "DepartmentCandidacy" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "candidateId" TEXT NOT NULL,
          "departmentId" TEXT NOT NULL,
          "roleId" TEXT,
          "hrOwnerId" TEXT,
          "status" TEXT NOT NULL DEFAULT 'active',
          "source" TEXT NOT NULL DEFAULT 'manual',
          "nominatedBy" TEXT,
          "nominationNote" TEXT,
          "jobPostingId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "DepartmentCandidacy_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE CASCADE,
          CONSTRAINT "DepartmentCandidacy_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE CASCADE,
          CONSTRAINT "DepartmentCandidacy_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleCatalog" ("id") ON DELETE SET NULL,
          CONSTRAINT "DepartmentCandidacy_candidateId_departmentId_key" UNIQUE("candidateId", "departmentId")
        )
      `);
      console.log('  ✓ Created DepartmentCandidacy table');

      // Create indexes
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "DepartmentCandidacy_departmentId_status_updatedAt_idx" ON "DepartmentCandidacy"("departmentId", "status", "updatedAt")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "DepartmentCandidacy_candidateId_idx" ON "DepartmentCandidacy"("candidateId")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "DepartmentCandidacy_hrOwnerId_idx" ON "DepartmentCandidacy"("hrOwnerId")
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "DepartmentCandidacy_jobPostingId_idx" ON "DepartmentCandidacy"("jobPostingId")
      `);
      console.log('  ✓ Created indexes');

      // Backfill from existing data
      const backfilled = await prisma.$executeRawUnsafe(`
        INSERT INTO "DepartmentCandidacy" (
          "id",
          "candidateId",
          "departmentId",
          "roleId",
          "hrOwnerId",
          "status",
          "source",
          "createdAt",
          "updatedAt"
        )
        SELECT
          gen_random_uuid()::text,
          c."id",
          c."departmentId",
          c."roleId",
          c."hrOwnerId",
          CASE WHEN c."finalDecision" = 'rejected' THEN 'dept_rejected' ELSE 'active' END,
          'manual',
          COALESCE(c."createdAt", NOW()),
          COALESCE(c."updatedAt", NOW())
        FROM "Candidate" c
        WHERE c."departmentId" IS NOT NULL
        ON CONFLICT ("candidateId", "departmentId") DO NOTHING
      `);
      console.log('  ✓ Backfilled existing candidate-department relationships');

    } else {
      console.log('✓ DepartmentCandidacy table already exists');
    }

    console.log('\n✓ Schema fixed! Staging database is now ready.');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixSchema();
