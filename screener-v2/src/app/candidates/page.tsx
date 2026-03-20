import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import {
  CandidateAssessmentPill,
  CandidateDecisionPill,
  CandidateStagePill
} from "@/components/candidates/CandidatePills";
import {
  candidateAssessmentStatusLabels,
  candidateAssessmentStatusValues,
  candidateFinalDecisionLabels,
  candidateFinalDecisionValues,
  candidateStageLabels,
  candidateStageValues,
  type CandidateAssessmentStatus,
  isCandidateAssessmentStatus,
  isCandidateFinalDecision,
  isCandidateStage
} from "@/lib/candidates/types";
import { listCandidates } from "@/lib/db/candidates";
import { StatusPill } from "@/components/primitives/StatusPill";

export const dynamic = "force-dynamic";

function candidateNextStep(candidate: Awaited<ReturnType<typeof listCandidates>>[number]) {
  const status = candidate.latestAssessment?.status ?? "none";
  if (status === "passed" || status === "review" || status === "failed") {
    return "Review assessment result";
  }
  if (status === "in_progress") {
    return "Wait for submission";
  }
  if (status === "invited") {
    return "Candidate has test access";
  }
  if (!candidate.resumeSource) {
    return "Capture resume source and resume";
  }
  return "Open candidate and continue";
}

function primaryAction(candidate: Awaited<ReturnType<typeof listCandidates>>[number]) {
  const status = candidate.latestAssessment?.status ?? "none";
  if ((status === "passed" || status === "review" || status === "failed") && candidate.latestAssessment?.attemptId) {
    return {
      href: `/results/${candidate.latestAssessment.attemptId}` as Route,
      label: "Open result"
    };
  }
  if (status === "none") {
    return {
      href: `/create-test?candidateId=${candidate.id}` as Route,
      label: "Create test"
    };
  }
  return {
    href: `/candidates/${candidate.id}` as Route,
    label: "Open candidate"
  };
}

export default async function CandidatesPage({
  searchParams
}: {
  searchParams: Promise<{ stage?: string; finalDecision?: string; assessmentStatus?: string }>;
}) {
  const params = await searchParams;
  const stage = params.stage && isCandidateStage(params.stage) ? params.stage : undefined;
  const finalDecision =
    params.finalDecision && isCandidateFinalDecision(params.finalDecision)
      ? params.finalDecision
      : undefined;
  const assessmentStatus =
    params.assessmentStatus && isCandidateAssessmentStatus(params.assessmentStatus)
      ? params.assessmentStatus
      : undefined;
  const rows = await listCandidates({
    stage,
    finalDecision,
    assessmentStatus
  });
  const awaitingTest = rows.filter((row) => (row.latestAssessment?.status ?? "none") === "none").length;
  const inProgress = rows.filter((row) => row.latestAssessment?.status === "in_progress").length;
  const readyForReview = rows.filter((row) => {
    const status = row.latestAssessment?.status;
    return status === "passed" || status === "review" || status === "failed";
  }).length;
  const newCandidates = rows.filter((row) => row.stage === "new").length;

  return (
    <SceneShell
      variant="results"
      eyebrow="Candidates"
      title="Candidate tracker"
      subtitle="Register candidates, upload resumes, create linked assessments, and track hiring signals in one place."
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
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">New candidates</p>
            <p className="text-2xl text-white">{newCandidates}</p>
            <p className="text-sm text-slate-300">Fresh records that likely need initial screening.</p>
          </StagePanel>
          <StagePanel className="space-y-2 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Need test</p>
            <p className="text-2xl text-white">{awaitingTest}</p>
            <p className="text-sm text-slate-300">Candidates without a linked assessment yet.</p>
          </StagePanel>
          <StagePanel className="space-y-2 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">In progress</p>
            <p className="text-2xl text-white">{inProgress}</p>
            <p className="text-sm text-slate-300">Candidates currently taking their assessment.</p>
          </StagePanel>
          <StagePanel className="space-y-2 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Review results</p>
            <p className="text-2xl text-white">{readyForReview}</p>
            <p className="text-sm text-slate-300">Candidates ready for a hiring decision review.</p>
          </StagePanel>
        </div>

        <StagePanel className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-2xl text-white">Filters</h2>
              <p className="text-sm text-slate-300">Narrow the tracker by stage, decision, or assessment state.</p>
            </div>
            <Link href={"/candidates" as Route}>
              <Button variant="secondary">Reset</Button>
            </Link>
          </div>

          <form method="get" className="grid gap-3 md:grid-cols-4">
            <label className="grid gap-1">
              <span className="text-sm text-slate-200">Stage</span>
              <select
                name="stage"
                defaultValue={stage ?? ""}
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              >
                <option value="">All stages</option>
                {candidateStageValues.map((value) => (
                  <option key={value} value={value}>
                    {candidateStageLabels[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-slate-200">Decision</span>
              <select
                name="finalDecision"
                defaultValue={finalDecision ?? ""}
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              >
                <option value="">All decisions</option>
                {candidateFinalDecisionValues.map((value) => (
                  <option key={value} value={value}>
                    {candidateFinalDecisionLabels[value]}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-slate-200">Assessment</span>
              <select
                name="assessmentStatus"
                defaultValue={assessmentStatus ?? ""}
                className="rounded-[18px] border border-white/16 bg-white/[0.05] px-4 py-3 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
              >
                <option value="">All statuses</option>
                {candidateAssessmentStatusValues.map((value) => (
                  <option key={value} value={value}>
                    {candidateAssessmentStatusLabels[value]}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Apply filters
              </Button>
            </div>
          </form>
        </StagePanel>

        {rows.length === 0 ? (
          <StagePanel className="space-y-3">
            <h2 className="text-2xl text-white">No candidates yet</h2>
            <p className="text-sm text-slate-300">Create the first candidate record to start tracking resumes, tests, and notes here.</p>
            <Link href={"/candidates/new" as Route}>
              <Button>Register candidate</Button>
            </Link>
          </StagePanel>
        ) : (
          <div className="space-y-3">
            {rows.map((candidate) => {
              const latestStatus = candidate.latestAssessment?.status ?? "none";
              const action = primaryAction(candidate);
              return (
                <StagePanel key={candidate.id} className="p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <CandidateStagePill stage={candidate.stage} />
                        <CandidateDecisionPill decision={candidate.finalDecision} />
                        <CandidateAssessmentPill status={latestStatus} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg text-white">{candidate.fullName}</p>
                        <p className="text-sm text-slate-300">{candidate.email}</p>
                        <p className="text-sm text-slate-400">
                          {candidate.positionAppliedFor || "Position not set"}
                          {candidate.resumeSource ? ` | ${candidate.resumeSource}` : ""}
                          {candidate.hrOwner ? ` | Owner: ${candidate.hrOwner}` : ""}
                        </p>
                        <p className="text-sm text-brand-100">Next step: {candidateNextStep(candidate)}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Latest score</p>
                        <p className="mt-1 text-base text-white">
                          {typeof candidate.latestAssessment?.finalPercent === "number"
                            ? `${candidate.latestAssessment.finalPercent.toFixed(1)} / 100`
                            : "No result yet"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Updated</p>
                        <p className="mt-1 text-sm text-slate-200">
                          {new Date(candidate.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center xl:justify-end">
                        <Link href={action.href}>
                          <Button variant={action.label === "Create test" ? "primary" : "secondary"}>{action.label}</Button>
                        </Link>
                      </div>
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
