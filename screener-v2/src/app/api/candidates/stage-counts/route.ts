import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireApiSession();

  const stageCounts = await prisma.candidate.groupBy({
    by: ["stage"],
    _count: true
  });

  const counts: Record<string, number> = {
    applicant: 0,
    pipeline: 0,
    screening: 0,
    interview: 0,
    testing: 0,
    decision: 0,
    closed: 0
  };

  for (const group of stageCounts) {
    if (group.stage in counts) {
      counts[group.stage] = group._count;
    }
  }

  return Response.json(counts);
}
