#!/usr/bin/env npx ts-node
/**
 * Data Recovery Script
 * Restores lost candidate field values from logic/relationships
 * Usage: npm run ts-node -- scripts/recover-data.ts
 */

import { prisma } from "@/lib/db/prisma";

async function recoverData() {
  console.log("🔧 Data Recovery Tool\n");
  console.log("This script will restore lost candidate field values...\n");

  try {
    // 1. Check current state
    console.log("Step 1: Analyzing current data state...");
    const nullStats = await prisma.$queryRaw<
      Array<{ field: string; null_count: number; total: number }>
    >`
      SELECT
        'stage' as field,
        COUNT(CASE WHEN "stage" IS NULL THEN 1 END) as null_count,
        COUNT(*) as total
      FROM "Candidate"
      UNION ALL
      SELECT
        'finalDecision',
        COUNT(CASE WHEN "finalDecision" IS NULL THEN 1 END),
        COUNT(*)
      FROM "Candidate"
      UNION ALL
      SELECT
        'nextAction',
        COUNT(CASE WHEN "nextAction" IS NULL THEN 1 END),
        COUNT(*)
      FROM "Candidate"
      UNION ALL
      SELECT
        'uiStatus',
        COUNT(CASE WHEN "uiStatus" IS NULL THEN 1 END),
        COUNT(*)
      FROM "Candidate"
    `;

    console.log("\nCurrent Data Status:");
    console.log("─".repeat(50));

    let hasNulls = false;
    for (const row of nullStats) {
      const percentage = ((row.null_count / row.total) * 100).toFixed(1);
      const status = row.null_count > 0 ? "❌" : "✓";
      console.log(
        `${status} ${row.field}: ${row.null_count}/${row.total} NULL (${percentage}%)`
      );
      if (row.null_count > 0) hasNulls = true;
    }

    if (!hasNulls) {
      console.log("\n✅ No data loss detected! All fields are populated.");
      console.log("\nNote: If you see NULL values in the UI, it may be:");
      console.log("  - A caching issue (clear browser cache)");
      console.log("  - A query filter issue (check API responses)");
      console.log("  - A frontend rendering issue");
      return;
    }

    console.log("\n" + "─".repeat(50));
    console.log("\nStep 2: Recovering lost data...\n");

    // 2. Recover uiStatus
    const uiStatusFixed = await prisma.$executeRaw`
      UPDATE "Candidate" c
      SET "uiStatus" = CASE
        WHEN c."finalDecision" = 'rejected' THEN 'rejected'
        WHEN c."finalDecision" = 'selected' THEN 'moved_forward'
        WHEN c."finalDecision" = 'on_hold' THEN 'need_review'
        WHEN c."nextAction" = 'review_result' THEN 'need_review'
        ELSE 'in_progress'
      END
      WHERE c."uiStatus" IS NULL OR c."uiStatus" = ''
    `;

    if (uiStatusFixed > 0) {
      console.log(`✓ Recovered uiStatus for ${uiStatusFixed} candidates`);
    }

    // 3. Recover stage (infer from finalDecision or set to 'screening')
    const stageFixed = await prisma.$executeRaw`
      UPDATE "Candidate" c
      SET "stage" = CASE
        WHEN c."finalDecision" = 'rejected' THEN 'closed'
        WHEN c."finalDecision" = 'selected' THEN 'offer'
        WHEN c."stage" IS NULL THEN 'screening'
        ELSE c."stage"
      END
      WHERE c."stage" IS NULL OR c."stage" = ''
    `;

    if (stageFixed > 0) {
      console.log(`✓ Recovered stage for ${stageFixed} candidates`);
    }

    // 4. Recover finalDecision (default to in_process)
    const finalDecisionFixed = await prisma.$executeRaw`
      UPDATE "Candidate" c
      SET "finalDecision" = 'in_process'
      WHERE c."finalDecision" IS NULL OR c."finalDecision" = ''
    `;

    if (finalDecisionFixed > 0) {
      console.log(`✓ Recovered finalDecision for ${finalDecisionFixed} candidates`);
    }

    // 5. Recover nextAction (default to none)
    const nextActionFixed = await prisma.$executeRaw`
      UPDATE "Candidate" c
      SET "nextAction" = 'none'
      WHERE c."nextAction" IS NULL OR c."nextAction" = ''
    `;

    if (nextActionFixed > 0) {
      console.log(`✓ Recovered nextAction for ${nextActionFixed} candidates`);
    }

    // 6. Verify recovery
    console.log("\n" + "─".repeat(50));
    console.log("\nStep 3: Verifying recovery...\n");

    const finalStats = await prisma.$queryRaw<
      Array<{ field: string; null_count: number }>
    >`
      SELECT 'stage' as field, COUNT(CASE WHEN "stage" IS NULL THEN 1 END) as null_count FROM "Candidate"
      UNION ALL
      SELECT 'finalDecision', COUNT(CASE WHEN "finalDecision" IS NULL THEN 1 END) FROM "Candidate"
      UNION ALL
      SELECT 'nextAction', COUNT(CASE WHEN "nextAction" IS NULL THEN 1 END) FROM "Candidate"
      UNION ALL
      SELECT 'uiStatus', COUNT(CASE WHEN "uiStatus" IS NULL THEN 1 END) FROM "Candidate"
    `;

    let recoverySuccess = true;
    for (const row of finalStats) {
      if (row.null_count > 0) {
        console.log(`❌ ${row.field}: Still has ${row.null_count} NULL values`);
        recoverySuccess = false;
      } else {
        console.log(`✓ ${row.field}: Fully recovered`);
      }
    }

    console.log("\n" + "=".repeat(50));
    if (recoverySuccess) {
      console.log("✅ DATA RECOVERY COMPLETE!");
      console.log("\nNext steps:");
      console.log("1. Clear browser cache (Ctrl+Shift+Del)");
      console.log("2. Refresh the page (Ctrl+R or Cmd+R)");
      console.log("3. Check if candidate data appears now");
      console.log("\nIf data still missing:");
      console.log("• Check git history for accidental deletions");
      console.log("• Review recent database backups");
      console.log("• Contact support with query results");
    } else {
      console.log("⚠️  RECOVERY INCOMPLETE");
      console.log("\nSome fields still have NULL values.");
      console.log("Manual intervention may be needed.");
    }
  } catch (error) {
    console.error("\n❌ Error during recovery:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

recoverData();
