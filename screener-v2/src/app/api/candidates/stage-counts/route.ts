import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireApiSession();

  const [stageCounts, applicantCount] = await Promise.all([
    prisma.candidate.groupBy({
      by: ["stage"],
      where: { intakeBucket: "pipeline" },
      _count: true
    }),
    prisma.candidate.count({
      where: { intakeBucket: "applicant" }
    })
  ]);

  const counts: Record<string, number> = {
    applicants: applicantCount,
    new: 0,
    screening: 0,
    interview: 0,
    testing: 0,
    decision: 0,
    offer: 0,
    closed: 0
  };

  for (const group of stageCounts) {
    if (group.stage in counts) {
      counts[group.stage] = group._count;
    }
  }

  return Response.json(counts);
}
