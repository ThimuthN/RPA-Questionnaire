#!/usr/bin/env npx ts-node
/**
 * Data Integrity Check & Recovery Script
 * Run after any migration or schema change
 * Usage: npm run ts-node -- scripts/check-data-integrity.ts
 */

import { prisma } from "@/lib/db/prisma";

async function checkDataIntegrity() {
  console.log("🔍 Data Integrity Check Started\n");

  try {
    // 1. Check candidate count
    const totalCandidates = await prisma.candidate.count();
    console.log(`✓ Total candidates: ${totalCandidates}`);

    // 2. Check for NULL critical fields
    const nullFieldCount = await prisma.$queryRaw<
      Array<{ field: string; count: number }>
    >`
      SELECT
        'stage' as field, COUNT(*) as count FROM "Candidate" WHERE "stage" IS NULL
      UNION ALL
      SELECT 'finalDecision', COUNT(*) FROM "Candidate" WHERE "finalDecision" IS NULL
      UNION ALL
      SELECT 'nextAction', COUNT(*) FROM "Candidate" WHERE "nextAction" IS NULL
      UNION ALL
      SELECT 'uiStatus', COUNT(*) FROM "Candidate" WHERE "uiStatus" IS NULL
      UNION ALL
      SELECT 'stage_empty', COUNT(*) FROM "Candidate" WHERE "stage" = ''
    `;

    console.log("\n⚠️  NULL/Empty Fields Check:");
    let hasIssues = false;
    for (const row of nullFieldCount) {
      if (row.count > 0) {
        console.log(`  ❌ ${row.field}: ${row.count} records have NULL/empty values`);
        hasIssues = true;
      } else {
        console.log(`  ✓ ${row.field}: All values populated`);
      }
    }

    // 3. Check uiStatus vs stage/finalDecision consistency
    const inconsistentStatus = await prisma.$queryRaw<Array<any>>`
      SELECT COUNT(*) as count
      FROM "Candidate" c
      WHERE
        (c."finalDecision" = 'rejected' AND c."uiStatus" != 'rejected')
        OR (c."finalDecision" = 'selected' AND c."uiStatus" != 'moved_forward')
        OR (c."finalDecision" = 'on_hold' AND c."uiStatus" != 'need_review')
    `;

    const inconsistentCount = inconsistentStatus[0]?.count || 0;
    if (inconsistentCount > 0) {
      console.log(
        `\n❌ uiStatus Inconsistency: ${inconsistentCount} records have mismatched status`
      );
      hasIssues = true;
    } else {
      console.log(`\n✓ uiStatus Consistency: All records have correct status`);
    }

    // 4. Check milestone integrity
    const candidatesWithoutMilestones = await prisma.candidate.count({
      where: {
        milestones: {
          none: {}
        }
      }
    });

    if (candidatesWithoutMilestones > 0) {
      console.log(
        `\n⚠️  ${candidatesWithoutMilestones} candidates without milestones`
      );
    } else {
      console.log(`\n✓ All candidates have milestones`);
    }

    // 5. Check department links
    const candidatesWithoutDept = await prisma.candidate.count({
      where: {
        departmentId: null,
        roleId: {
          not: null
        }
      }
    });

    if (candidatesWithoutDept > 0) {
      console.log(
        `\n⚠️  ${candidatesWithoutDept} candidates with role but no department (may need backfill)`
      );
    } else {
      console.log(`\n✓ Department links verified`);
    }

    // 6. Summary
    console.log("\n" + "=".repeat(50));
    if (hasIssues) {
      console.log("❌ DATA INTEGRITY ISSUES DETECTED!");
      console.log("\nRecovery Steps:");
      console.log("1. Review MIGRATION_SAFETY_CHECKLIST.md");
      console.log("2. Check recent migrations: npx prisma migrate status");
      console.log("3. Run recovery scripts below\n");

      // Offer to fix uiStatus
      console.log("Run this to fix uiStatus values:");
      console.log(`
  npx prisma db execute --stdin <<'EOF'
  UPDATE "Candidate" c
  SET "uiStatus" = CASE
    WHEN c."finalDecision" = 'rejected' THEN 'rejected'
    WHEN c."finalDecision" = 'selected' THEN 'moved_forward'
    WHEN c."finalDecision" = 'on_hold' THEN 'need_review'
    WHEN c."nextAction" = 'review_result' THEN 'need_review'
    ELSE 'in_progress'
  END
  WHERE c."uiStatus" IS NULL OR c."uiStatus" = '';
  EOF
      `);
    } else {
      console.log("✅ DATA INTEGRITY CHECK PASSED!");
      console.log("All critical fields are populated and consistent.");
    }
  } catch (error) {
    console.error("\n❌ Error during integrity check:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDataIntegrity();
