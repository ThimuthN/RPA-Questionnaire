import { prisma } from "@/lib/db/prisma";

export type EmployeeWorkspaceFilters = {
  q?: string;
  contextType?: string;
  reviewState?: string;
  page?: number;
  pageSize?: number;
};

export type EmployeeWorkspaceRow = {
  id: string;
  fullName: string;
  email: string;
  employeeId?: string;
  createdAt: string;
  latestAttemptId?: string;
  latestAssessmentLabel?: string;
  latestContextType: string;
  latestStatus: string;
  latestReviewState?: string;
  latestScore?: number;
  latestSubmittedAt?: string;
  completedCount: number;
};

export type EmployeeWorkspacePage = {
  rows: EmployeeWorkspaceRow[];
  total: number;
  page: number;
  pageSize: number;
  summary: {
    activeEmployees: number;
    withCompletedResults: number;
    certifications: number;
  };
  contextOptions: string[];
  reviewStateOptions: string[];
};

function toTitleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function assessmentLabelFromAttempt(args: {
  inviteSlug?: string;
  contextType: string;
}) {
  if (args.inviteSlug) {
    return `Assessment ${args.inviteSlug.toUpperCase()}`;
  }

  return `${toTitleCase(args.contextType)} assessment`;
}

export async function listEmployeeWorkspacePage(
  filters: EmployeeWorkspaceFilters = {}
): Promise<EmployeeWorkspacePage> {
  const employees = await prisma.participant.findMany({
    where: { kind: "employee" },
    orderBy: [{ createdAt: "desc" }, { fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      email: true,
      employeeId: true,
      createdAt: true
    }
  });

  const participantIds = employees.map((row) => row.id);
  const attempts =
    participantIds.length > 0
      ? await prisma.attempt.findMany({
          where: {
            participantId: { in: participantIds }
          },
          orderBy: [{ startedAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            participantId: true,
            inviteId: true,
            contextType: true,
            status: true,
            startedAt: true,
            submittedAt: true
          }
        })
      : [];

  const attemptIds = attempts.map((row) => row.id);
  const inviteIds = [...new Set(attempts.map((row) => row.inviteId).filter((value): value is string => Boolean(value)))];

  const [results, invites] = await Promise.all([
    attemptIds.length > 0
      ? prisma.result.findMany({
          where: { attemptId: { in: attemptIds } },
          select: {
            attemptId: true,
            finalPercent: true,
            reviewState: true,
            contextType: true
          }
        })
      : Promise.resolve([]),
    inviteIds.length > 0
      ? prisma.invite.findMany({
          where: { id: { in: inviteIds } },
          select: {
            id: true,
            slug: true
          }
        })
      : Promise.resolve([])
  ]);

  const resultsByAttemptId = new Map(results.map((row) => [row.attemptId, row]));
  const invitesById = new Map(invites.map((row) => [row.id, row]));

  const rows = employees.map((employee) => {
    const employeeAttempts = attempts.filter((attempt) => attempt.participantId === employee.id);
    const latestAttempt = employeeAttempts[0];
    const latestResult = latestAttempt ? resultsByAttemptId.get(latestAttempt.id) : null;
    const latestInvite = latestAttempt?.inviteId ? invitesById.get(latestAttempt.inviteId) : null;

    return {
      id: employee.id,
      fullName: employee.fullName,
      email: employee.email,
      employeeId: employee.employeeId ?? undefined,
      createdAt: employee.createdAt.toISOString(),
      latestAttemptId: latestAttempt?.id,
      latestAssessmentLabel: latestAttempt
        ? assessmentLabelFromAttempt({
            inviteSlug: latestInvite?.slug,
            contextType: latestAttempt.contextType
          })
        : undefined,
      latestContextType: latestResult?.contextType ?? latestAttempt?.contextType ?? "general",
      latestStatus: latestAttempt?.status ?? "not_started",
      latestReviewState: latestResult?.reviewState ?? undefined,
      latestScore: typeof latestResult?.finalPercent === "number" ? latestResult.finalPercent : undefined,
      latestSubmittedAt: latestAttempt?.submittedAt?.toISOString(),
      completedCount: employeeAttempts.filter((attempt) => Boolean(attempt.submittedAt)).length
    } satisfies EmployeeWorkspaceRow;
  });

  const query = filters.q?.trim().toLowerCase() ?? "";
  const contextType = filters.contextType?.trim() ?? "";
  const reviewState = filters.reviewState?.trim() ?? "";
  const page = Math.max(1, Number(filters.page ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(filters.pageSize ?? 12)));

  const filtered = rows.filter((row) => {
    if (query) {
      const haystack = [row.fullName, row.email, row.employeeId ?? "", row.latestAssessmentLabel ?? ""]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (contextType && row.latestContextType !== contextType) return false;
    if (reviewState && (row.latestReviewState ?? "") !== reviewState) return false;
    return true;
  });

  const start = (page - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const contextOptions = [...new Set(rows.map((row) => row.latestContextType).filter(Boolean))].sort();
  const reviewStateOptions = [...new Set(rows.map((row) => row.latestReviewState).filter(Boolean))].sort() as string[];

  return {
    rows: pageRows,
    total: filtered.length,
    page,
    pageSize,
    summary: {
      activeEmployees: rows.length,
      withCompletedResults: rows.filter((row) => typeof row.latestScore === "number").length,
      certifications: rows.filter((row) => row.latestContextType === "certification").length
    },
    contextOptions,
    reviewStateOptions
  };
}
