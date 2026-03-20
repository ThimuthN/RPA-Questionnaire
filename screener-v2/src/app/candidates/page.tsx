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
  isCandidateAssessmentStatus,
  isCandidateFinalDecision,
  isCandidateStage
} from "@/lib/candidates/types";
import { listCandidates } from "@/lib/db/candidates";
import { StatusPill } from "@/components/primitives/StatusPill";

export const dynamic = "force-dynamic";

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
                        <Link href={`/candidates/${candidate.id}` as Route}>
                          <Button variant="secondary">Open candidate</Button>
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
