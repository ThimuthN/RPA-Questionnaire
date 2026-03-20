import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import {
  CandidateAssessmentPill,
  CandidateUiStatusPill
} from "@/components/candidates/CandidatePills";
import {
  candidateAssessmentStatusLabels,
  candidateAssessmentStatusValues,
  candidateUiStatusLabels,
  candidateUiStatusValues,
  isCandidateAssessmentStatus,
  isCandidateUiStatus
} from "@/lib/candidates/types";
import { getCandidateUiStatus } from "@/lib/candidates/ui-status";
import { listCandidates } from "@/lib/db/candidates";
import { StatusPill } from "@/components/primitives/StatusPill";

export const dynamic = "force-dynamic";

type CandidateRow = Awaited<ReturnType<typeof listCandidates>>[number];

function screenerStatus(candidate: CandidateRow) {
  return candidate.latestAssessment?.status ?? "none";
}

function candidateStatus(candidate: CandidateRow) {
  return getCandidateUiStatus({
    stage: candidate.stage,
    finalDecision: candidate.finalDecision,
    nextAction: candidate.nextAction,
    screeningStatus: candidate.screeningStatus,
    latestAssessmentStatus: screenerStatus(candidate)
  });
}

function candidateContext(candidate: CandidateRow) {
  const screener = screenerStatus(candidate);
  const status = candidateStatus(candidate);

  if (!candidate.hasResume) return "Resume needed";
  if (status === "moved_forward") return "Moved forward";
  if (status === "on_hold") return "On hold";
  if (status === "rejected") return "Rejected";
  if (screener === "passed" || screener === "review" || screener === "failed") return "Result ready";
  if (screener === "invited" || screener === "in_progress") return "Waiting for submission";
  return "Ready for screener";
}

function primaryAction(candidate: CandidateRow) {
  const screener = screenerStatus(candidate);

  if (!candidate.hasResume) {
    return {
      href: `/candidates/${candidate.id}` as Route,
      label: "Upload resume"
    };
  }

  if (
    (screener === "passed" || screener === "review" || screener === "failed") &&
    candidate.latestAssessment?.attemptId
  ) {
    return {
      href: `/results/${candidate.latestAssessment.attemptId}` as Route,
      label: "View result"
    };
  }

  if (screener === "none") {
    return {
      href: `/create-test?candidateId=${candidate.id}` as Route,
      label: "Send test"
    };
  }

  return {
    href: `/candidates/${candidate.id}` as Route,
    label: "Open"
  };
}

export default async function CandidatesPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; screener?: string }>;
}) {
  const params = await searchParams;
  const status = params.status && isCandidateUiStatus(params.status) ? params.status : undefined;
  const screener = params.screener && isCandidateAssessmentStatus(params.screener) ? params.screener : undefined;

  const allRows = await listCandidates();
  const rows = allRows.filter((candidate) => {
    if (status && candidateStatus(candidate) !== status) return false;
    if (screener && screenerStatus(candidate) !== screener) return false;
    return true;
  });

  const needResume = rows.filter((candidate) => !candidate.hasResume).length;
  const readyToSend = rows.filter(
    (candidate) => candidate.hasResume && screenerStatus(candidate) === "none"
  ).length;
  const waitingOnTest = rows.filter((candidate) => {
    const status = screenerStatus(candidate);
    return status === "invited" || status === "in_progress";
  }).length;
  const needReview = rows.filter((candidate) => candidateStatus(candidate) === "result_ready").length;

  return (
    <SceneShell
      variant="results"
      eyebrow="Candidates"
      title="Candidates"
      subtitle="Track resumes, screeners, and notes."
      utility={
        <div className="flex flex-wrap gap-2">
          <StatusPill label={`Total ${rows.length}`} tone="neutral" />
          <Link href={"/candidates/new" as Route}>
            <Button>Register candidate</Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StagePanel className="space-y-2 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Need resume</p>
            <p className="text-2xl text-white">{needResume}</p>
          </StagePanel>
          <StagePanel className="space-y-2 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Ready to send</p>
            <p className="text-2xl text-white">{readyToSend}</p>
          </StagePanel>
          <StagePanel className="space-y-2 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Waiting on test</p>
            <p className="text-2xl text-white">{waitingOnTest}</p>
          </StagePanel>
          <StagePanel className="space-y-2 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Need review</p>
            <p className="text-2xl text-white">{needReview}</p>
          </StagePanel>
        </div>

        <StagePanel className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl text-white">Filter</h2>
            <Link href={"/candidates" as Route}>
              <Button variant="secondary">Reset</Button>
            </Link>
          </div>

          <form method="get" className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-1">
              <span className="text-sm text-slate-200">Status</span>
              <select
                name="status"
                defaultValue={status ?? ""}
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              >
                <option value="">All statuses</option>
                {candidateUiStatusValues.map((value) => (
                  <option key={value} value={value}>
                    {candidateUiStatusLabels[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-slate-200">Screener</span>
              <select
                name="screener"
                defaultValue={screener ?? ""}
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              >
                <option value="">All screener states</option>
                {candidateAssessmentStatusValues.map((value) => (
                  <option key={value} value={value}>
                    {candidateAssessmentStatusLabels[value]}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Apply
              </Button>
            </div>
          </form>
        </StagePanel>

        {rows.length === 0 ? (
          <StagePanel className="space-y-3">
            <h2 className="text-2xl text-white">No candidates yet</h2>
            <p className="text-sm text-slate-300">Add a candidate to start tracking their resume, screener, and notes.</p>
            <Link href={"/candidates/new" as Route}>
              <Button>Register candidate</Button>
            </Link>
          </StagePanel>
        ) : (
          <div className="space-y-3">
            {rows.map((candidate) => {
              const uiStatus = candidateStatus(candidate);
              const action = primaryAction(candidate);
              const actionIsPrimary = action.label === "Send test" || action.label === "Upload resume";

              return (
                <StagePanel key={candidate.id} className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <CandidateUiStatusPill status={uiStatus} />
                        <CandidateAssessmentPill status={screenerStatus(candidate)} />
                      </div>

                      <div className="space-y-1">
                        <p className="text-lg text-white">{candidate.fullName}</p>
                        <p className="text-sm text-slate-300">
                          {candidate.positionAppliedFor || "Role not set"}
                        </p>
                        <p className="text-sm text-slate-400">
                          {candidate.hrOwner ? `Owner: ${candidate.hrOwner}` : "No owner"}
                        </p>
                        <p className="text-sm text-brand-100">{candidateContext(candidate)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <p className="text-xs text-slate-400">
                        Updated {new Date(candidate.updatedAt).toLocaleString()}
                      </p>
                      <Link href={action.href}>
                        <Button variant={actionIsPrimary ? "primary" : "secondary"}>{action.label}</Button>
                      </Link>
                    </div>
                  </div>
                </StagePanel>
              );
            })}
          </div>
        )}
      </div>
    </SceneShell>
  );
}
