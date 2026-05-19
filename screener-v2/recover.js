#!/usr/bin/env node
/**
 * Simple Data Recovery Script
 * Recovers lost candidate field values
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recover() {
  console.log('🔧 Starting Data Recovery...\n');

  try {
    // Check current state
    console.log('Step 1: Checking current data state...');
    const result = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN "stage" IS NULL THEN 1 ELSE 0 END) as stage_null,
        SUM(CASE WHEN "finalDecision" IS NULL THEN 1 ELSE 0 END) as finalDecision_null,
        SUM(CASE WHEN "nextAction" IS NULL THEN 1 ELSE 0 END) as nextAction_null,
        SUM(CASE WHEN "uiStatus" IS NULL THEN 1 ELSE 0 END) as uiStatus_null
      FROM "Candidate"
    `;

    const data = result[0] || result;
    console.log(`\nTotal candidates: ${data.total}`);
    console.log(`Stage NULL: ${data.stage_null}`);
    console.log(`FinalDecision NULL: ${data.finalDecision_null}`);
    console.log(`NextAction NULL: ${data.nextAction_null}`);
    console.log(`uiStatus NULL: ${data.uiStatus_null}`);

    const hasNulls = data.stage_null > 0 || data.finalDecision_null > 0 ||
                     data.nextAction_null > 0 || data.uiStatus_null > 0;

    if (!hasNulls) {
      console.log('\n✅ No NULL values found! Data appears to be intact.');
      process.exit(0);
    }

    console.log('\n📋 Recovering lost data...\n');

    // Recover uiStatus
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
      console.log(`✓ Recovered uiStatus: ${uiStatusFixed} records`);
    }

    // Recover stage
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
      console.log(`✓ Recovered stage: ${stageFixed} records`);
    }

    // Recover finalDecision
    const finalDecisionFixed = await prisma.$executeRaw`
      UPDATE "Candidate" c
      SET "finalDecision" = 'in_process'
      WHERE c."finalDecision" IS NULL OR c."finalDecision" = ''
    `;
    if (finalDecisionFixed > 0) {
      console.log(`✓ Recovered finalDecision: ${finalDecisionFixed} records`);
    }

    // Recover nextAction
    const nextActionFixed = await prisma.$executeRaw`
      UPDATE "Candidate" c
      SET "nextAction" = 'none'
      WHERE c."nextAction" IS NULL OR c."nextAction" = ''
    `;
    if (nextActionFixed > 0) {
      console.log(`✓ Recovered nextAction: ${nextActionFixed} records`);
    }

    // Verify
    console.log('\n✅ Verifying recovery...\n');
    const finalResult = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN "stage" IS NULL THEN 1 ELSE 0 END) as stage_null,
        SUM(CASE WHEN "finalDecision" IS NULL THEN 1 ELSE 0 END) as finalDecision_null,
        SUM(CASE WHEN "nextAction" IS NULL THEN 1 ELSE 0 END) as nextAction_null,
        SUM(CASE WHEN "uiStatus" IS NULL THEN 1 ELSE 0 END) as uiStatus_null
      FROM "Candidate"
    `;

    const finalData = finalResult[0] || finalResult;
    console.log(`Total candidates: ${finalData.total}`);
    console.log(`Stage NULL: ${finalData.stage_null}`);
    console.log(`FinalDecision NULL: ${finalData.finalDecision_null}`);
    console.log(`NextAction NULL: ${finalData.nextAction_null}`);
    console.log(`uiStatus NULL: ${finalData.uiStatus_null}`);

    const stillHasNulls = finalData.stage_null > 0 || finalData.finalDecision_null > 0 ||
                          finalData.nextAction_null > 0 || finalData.uiStatus_null > 0;

    if (!stillHasNulls) {
      console.log('\n🎉 DATA RECOVERY SUCCESSFUL!');
      console.log('\nNext steps:');
      console.log('1. Clear your browser cache (Ctrl+Shift+Del)');
      console.log('2. Refresh the page (Ctrl+R)');
      console.log('3. Your candidate data should now be visible\n');
    } else {
      console.log('\n⚠️  Some fields still have NULL values.');
      console.log('Manual review may be needed.\n');
    }

  } catch (error) {
    console.error('❌ Error during recovery:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

recover();
