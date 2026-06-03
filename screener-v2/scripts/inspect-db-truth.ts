import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectDB() {
  console.log("=== STAGING DB TRUTH INSPECTION ===\n");

  const dbInfo = await prisma.$queryRaw`
    SELECT current_database() as db, current_user as user_account;
  ` as any;

  console.log(`Database: ${dbInfo[0].db}`);
  console.log(`User: ${dbInfo[0].user_account} (no connection string printed)\n`);

  const deptCount = await prisma.department.count();
  const roleCount = await prisma.roleCatalog.count();
  const rolePermsCount = await prisma.rolePermissionTemplate.count();
  const userCount = await prisma.user.count();
  const candidateCount = await prisma.candidate.count();
  const appCount = await prisma.candidateApplication.count();
  const milestoneCount = await prisma.candidateMilestone.count();
  const assignmentCount = await prisma.hiringAssignment.count();
  const noteCount = await prisma.candidateNote.count();
  const activityCount = await prisma.candidateActivityEvent.count();
  const resultCount = await prisma.result.count();
  const attemptCount = await prisma.attempt.count();
  const inviteCount = await prisma.invite.count();
  const grantCount = await prisma.accessGrant.count();

  console.log("TABLE COUNTS:");
  console.log(`  Department: ${deptCount}`);
  console.log(`  RoleCatalog: ${roleCount}`);
  console.log(`  RolePermissionTemplate: ${rolePermsCount}`);
  console.log(`  User: ${userCount}`);
  console.log(`  Candidate: ${candidateCount}`);
  console.log(`  CandidateApplication: ${appCount}`);
  console.log(`  CandidateMilestone: ${milestoneCount}`);
  console.log(`  HiringAssignment: ${assignmentCount}`);
  console.log(`  CandidateNote: ${noteCount}`);
  console.log(`  CandidateActivityEvent: ${activityCount}`);
  console.log(`  Result: ${resultCount}`);
  console.log(`  Attempt: ${attemptCount}`);
  console.log(`  Invite: ${inviteCount}`);
  console.log(`  AccessGrant: ${grantCount}\n`);

  // RoleCatalog kind distribution
  const roleKinds = await prisma.roleCatalog.groupBy({
    by: ["kind"],
    _count: true
  });

  console.log("ROLECATALOG.KIND DISTRIBUTION:");
  let totalKind = 0;
  roleKinds.forEach(rk => {
    console.log(`  ${rk.kind || "null"}: ${rk._count}`);
    totalKind += rk._count;
  });
  console.log(`  Total: ${totalKind}\n`);

  // Bootstrap admin checks
  const tnayanaUser = await prisma.user.findFirst({
    where: { email: "tnayanapriya@innobothealth.com" }
  });

  const northstarUser = await prisma.user.findFirst({
    where: { email: "admin@northstar.local" }
  });

  console.log("BOOTSTRAP ADMIN CHECK:");
  console.log(`  tnayanapriya@innobothealth.com exists: ${tnayanaUser ? "YES" : "NO"}`);
  if (tnayanaUser) {
    const grants = await prisma.accessGrant.count({ where: { userId: tnayanaUser.id } });
    console.log(`    - AccessGrants: ${grants}`);
    console.log(`    - Password hash set: ${tnayanaUser.passwordHash ? "YES" : "NO"}`);
  }
  console.log(`  admin@northstar.local exists: ${northstarUser ? "YES" : "NO"}`);
  if (northstarUser) {
    const grants = await prisma.accessGrant.count({ where: { userId: northstarUser.id } });
    console.log(`    - AccessGrants: ${grants}`);
  }

  console.log("\n✓ DB truth inspection complete.");
}

inspectDB()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
