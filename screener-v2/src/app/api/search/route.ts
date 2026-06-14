import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export type SearchResult = {
  candidates: Array<{ id: string; fullName: string; email: string; stage: string; roleLabel?: string }>;
  jobs: Array<{ id: string; title: string; department?: string; isOpen: boolean }>;
  applicants: Array<{ id: string; candidateName: string; jobTitle: string }>;
};

export async function GET(request: NextRequest) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  if (!auth.session.permissions.includes("view_candidates")) {
    return NextResponse.json({ candidates: [], jobs: [], applicants: [] } satisfies SearchResult);
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ candidates: [], jobs: [], applicants: [] } satisfies SearchResult);
  }

  const like = `%${q.replace(/[%_]/g, "\\$&")}%`;
  const tsQuery = q
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w}:*`)
    .join(" & ");

  type CandidateRow = { id: string; fullName: string; email: string; stage: string; roleLabel: string | null };
  type JobRow = { id: string; title: string; isOpen: boolean; department: { name: string } | null };
  type ApplicantRow = { id: string; candidate: { fullName: string }; jobPosting: { title: string } };

  const [candidates, jobs, applicants] = await Promise.all([
    prisma.$queryRaw<CandidateRow[]>`
      SELECT id, "fullName", email, stage, "roleLabel"
      FROM "Candidate"
      WHERE (
        "searchVector" @@ to_tsquery('simple', ${tsQuery})
        OR LOWER("fullName") LIKE LOWER(${like})
        OR LOWER(email) LIKE LOWER(${like})
      )
      AND "orgStage" = 'active'
      ORDER BY ts_rank("searchVector", to_tsquery('simple', ${tsQuery})) DESC
      LIMIT 6
    `,
    prisma.jobPosting.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        isOpen: true,
        department: { select: { name: true } },
      },
      take: 4,
      orderBy: { updatedAt: "desc" },
    }) as Promise<JobRow[]>,
    prisma.candidateApplication.findMany({
      where: {
        candidate: {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        status: { in: ["submitted", "under_review"] },
      },
      select: {
        id: true,
        candidate: { select: { fullName: true } },
        jobPosting: { select: { title: true } },
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    }) as Promise<ApplicantRow[]>,
  ]).catch((): [CandidateRow[], JobRow[], ApplicantRow[]] => [[], [], []]);

  const result: SearchResult = {
    candidates: candidates.map((c: CandidateRow) => ({
      id: c.id,
      fullName: c.fullName,
      email: c.email,
      stage: c.stage,
      roleLabel: c.roleLabel ?? undefined,
    })),
    jobs: jobs.map((j: JobRow) => ({
      id: j.id,
      title: j.title,
      isOpen: j.isOpen,
      department: j.department?.name ?? undefined,
    })),
    applicants: applicants.map((a: ApplicantRow) => ({
      id: a.id,
      candidateName: a.candidate.fullName,
      jobTitle: a.jobPosting.title,
    })),
  };

  return NextResponse.json(result);
}
