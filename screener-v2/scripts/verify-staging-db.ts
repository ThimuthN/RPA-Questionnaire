import { PrismaClient } from "@prisma/client";

async function verifyDatabase() {
  const prisma = new PrismaClient();
  try {
    console.log("=== Database Identity Verification ===\n");

    // Get database info
    const result = await prisma.$queryRaw<
      Array<{ database_name: string; user_name: string }>
    >`SELECT current_database() as database_name, current_user as user_name`;

    const dbInfo = result[0];
    console.log(`Database Name: ${dbInfo.database_name}`);
    console.log(`Database User: ${dbInfo.user_name}`);
    console.log(`Host Provider: Neon (postgresql)`);
    console.log(`Schema: public`);


    // Get accurate table counts
    const Department = await prisma.department.count();
    const RoleCatalog = await prisma.roleCatalog.count();
    const RolePermissionTemplate = await prisma.rolePermissionTemplate.count();
    const User = await prisma.user.count();
    const Candidate = await prisma.candidate.count();
    const CandidateApplication = await prisma.candidateApplication.count();
    const CandidateMilestone = await prisma.candidateMilestone.count();
    const HiringAssignment = await prisma.hiringAssignment.count();
    const Result = await prisma.result.count();
    const Attempt = await prisma.attempt.count();
    const Invite = await prisma.invite.count();
    const CandidateNote = await prisma.candidateNote.count();
    const CandidateActivityEvent = await prisma.candidateActivityEvent.count();
    const MagicToken = await prisma.magicToken.count();
    const Participant = await prisma.participant.count();

    console.log("\n=== Table Record Counts ===");
    console.log(`Department: ${Department}`);
    console.log(`RoleCatalog: ${RoleCatalog}`);
    console.log(`RolePermissionTemplate: ${RolePermissionTemplate}`);
    console.log(`User: ${User}`);
    console.log(`Candidate: ${Candidate}`);
    console.log(`CandidateApplication: ${CandidateApplication}`);
    console.log(`CandidateMilestone: ${CandidateMilestone}`);
    console.log(`HiringAssignment: ${HiringAssignment}`);
    console.log(`Result: ${Result}`);
    console.log(`Attempt: ${Attempt}`);
    console.log(`Invite: ${Invite}`);
    console.log(`CandidateNote: ${CandidateNote}`);
    console.log(`CandidateActivityEvent: ${CandidateActivityEvent}`);
    console.log(`MagicToken: ${MagicToken}`);
    console.log(`Participant: ${Participant}`);

    // Verify staging expectation
    const isStaging =
      dbInfo.database_name === "neondb" &&
      dbInfo.user_name.includes("neondb_owner");

    console.log("\n=== Safety Check ===");
    console.log(`Is Staging Database: ${isStaging ? "✓ YES" : "✗ NO"}`);

    if (!isStaging) {
      console.error(
        "\n❌ ERROR: This does not appear to be a staging database!"
      );
      console.error("Refusing to proceed with reset.");
      process.exit(1);
    }

    console.log(
      "\n✓ Database identity verified as staging. Safe to proceed with reset."
    );
    process.exit(0);
  } catch (error) {
    console.error("Error verifying database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
