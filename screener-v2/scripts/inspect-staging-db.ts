import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectStagingDb() {
  console.log("=== STAGING DB TRUTH INSPECTION ===\n");

  // Verify database identity
  const result = await prisma.$queryRaw`
    SELECT current_database() as db, current_user as user_account, now() as server_time;
  `;
  console.log("Database Identity:");
  console.log(result);
  console.log();

  console.log("Table Counts (Preservation/Wipe Analysis):");
  console.log("==========================================");

  const counts: Record<string, number> = {};

  // Department count
  const deptCount = await prisma.department.count();
  counts["Department"] = deptCount;
  console.log(`Department: ${deptCount} (PRESERVE)`);

  // RoleCatalog count
  const roleCount = await prisma.roleCatalog.count();
  counts["RoleCatalog"] = roleCount;
  console.log(`RoleCatalog: ${roleCount} (PRESERVE - job designations)`);

  // User count
  const userCount = await prisma.user.count();
  counts["User"] = userCount;
  console.log(`User: ${userCount} (WIPE - except bootstrap admin)`);

  // Candidate count
  const candidateCount = await prisma.candidate.count();
  counts["Candidate"] = candidateCount;
  console.log(`Candidate: ${candidateCount} (WIPE)`);

  // CandidateApplication count
  const appCount = await prisma.candidateApplication.count();
  counts["CandidateApplication"] = appCount;
  console.log(`CandidateApplication: ${appCount} (WIPE)`);

  // CandidateNote count
  const noteCount = await prisma.candidateNote.count();
  counts["CandidateNote"] = noteCount;
  console.log(`CandidateNote: ${noteCount} (WIPE)`);

  // CandidateAssessment count
  const assessCount = await prisma.candidateAssessment.count();
  counts["CandidateAssessment"] = assessCount;
  console.log(`CandidateAssessment: ${assessCount} (WIPE)`);

  // CandidateMilestone count
  const milestoneCount = await prisma.candidateMilestone.count();
  counts["CandidateMilestone"] = milestoneCount;
  console.log(`CandidateMilestone: ${milestoneCount} (WIPE)`);

  // HiringAssignment count
  const assignCount = await prisma.hiringAssignment.count();
  counts["HiringAssignment"] = assignCount;
  console.log(`HiringAssignment: ${assignCount} (WIPE)`);

  // CandidateActivityEvent count
  const activityCount = await prisma.candidateActivityEvent.count();
  counts["CandidateActivityEvent"] = activityCount;
  console.log(`CandidateActivityEvent: ${activityCount} (WIPE)`);

  // Attempt count
  const attemptCount = await prisma.attempt.count();
  counts["Attempt"] = attemptCount;
  console.log(`Attempt: ${attemptCount} (WIPE)`);

  // Invite count
  const inviteCount = await prisma.invite.count();
  counts["Invite"] = inviteCount;
  console.log(`Invite: ${inviteCount} (WIPE)`);

  // InterviewPanel count
  const panelCount = await prisma.interviewPanel.count();
  counts["InterviewPanel"] = panelCount;
  console.log(`InterviewPanel: ${panelCount} (WIPE)`);

  // DepartmentCandidacy count
  const deptCandidacyCount = await prisma.departmentCandidacy.count();
  counts["DepartmentCandidacy"] = deptCandidacyCount;
  console.log(`DepartmentCandidacy: ${deptCandidacyCount} (WIPE)`);

  console.log("\n=== PRESERVATION/WIPE CLASSIFICATION ===\n");
  console.log("PRESERVE:");
  console.log(`  - Department: ${counts["Department"]}`);
  console.log(`  - RoleCatalog: ${counts["RoleCatalog"]}`);

  const wipeTables = [
    "User",
    "Candidate",
    "CandidateApplication",
    "CandidateNote",
    "CandidateAssessment",
    "CandidateMilestone",
    "HiringAssignment",
    "CandidateActivityEvent",
    "Attempt",
    "Invite",
    "InterviewPanel",
    "DepartmentCandidacy"
  ];

  console.log("\nWIPE (clean slate):");
  let wipeTotal = 0;
  for (const table of wipeTables) {
    const count = counts[table] || 0;
    console.log(`  - ${table}: ${count}`);
    wipeTotal += count;
  }

  console.log(`\nTotal records to wipe: ${wipeTotal}`);
  console.log(`Total records to preserve: ${counts["Department"] + counts["RoleCatalog"]}`);

  console.log("\n=== MIGRATION STATUS (will be checked after prisma generate) ===\n");
  console.log("Run: npx prisma migrate status");

  console.log("\n✓ DB truth inspection complete. Ready for schema migration and reset script creation.");
}

inspectStagingDb().catch(console.error).finally(() => prisma.$disconnect());
