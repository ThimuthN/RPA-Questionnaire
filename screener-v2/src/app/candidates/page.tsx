import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { ConfirmSubmitButton } from "@/components/primitives/ConfirmSubmitButton";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import {
  CandidateAssessmentPill,
  CandidateUiStatusPill
} from "@/components/candidates/CandidatePills";
import type { CandidateUiStatus } from "@/lib/candidates/types";
import { isCandidateUiStatus } from "@/lib/candidates/types";
import { getCandidateUiStatus } from "@/lib/candidates/ui-status";
import { listCandidates } from "@/lib/db/candidates";

export const dynamic = "force-dynamic";

type CandidateRow = Awaited<ReturnType<typeof listCandidates>>[number];

const trackerFilterOptions: Array<{ value?: CandidateUiStatus; label: string }> = [
  { label: "All" },
  { value: "in_progress", label: "In progress" },
  { value: "need_review", label: "Need review" },
  { value: "moved_forward", label: "Moved forward" },
  { value: "rejected", label: "Rejected" }
];

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
  if (candidate.currentFocus) return candidate.currentFocus;
  if (status === "moved_forward") return "Moved forward";
  if (status === "rejected") return "Rejected";
  if (status === "need_review") return "Result ready";
  if (screener === "invited" || screener === "in_progress") return "Waiting for submission";
  return "Ready for screener";
}

function primaryAction(candidate: CandidateRow) {
  const screener = screenerStatus(candidate);

  if (!candidate.hasResume) {
    return {
      href: `/candidates/${candidate.id}` as Route,
      label: "Add resume"
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
      label: "Send screener"
    };
  }

  return {
    href: `/candidates/${candidate.id}` as Route,
    label: "Open"
  };
}

function chipClass(active: boolean) {
  return active
    ? "inline-flex rounded-full border border-brand-300/60 bg-brand-500/15 px-3 py-2 text-sm text-white"
    : "inline-flex rounded-full border border-white/16 bg-white/[0.05] px-3 py-2 text-sm text-slate-200 transition hover:border-white/30 hover:bg-white/[0.08]";
}

export default async function CandidatesPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; deleted?: string; error?: string }>;
}) {
  const params = await searchParams;
  const status = params.status && isCandidateUiStatus(params.status) ? params.status : undefined;

  const allRows = await listCandidates();
  const rows = allRows.filter((candidate) => {
    if (status && candidateStatus(candidate) !== status) return false;
    return true;
  });

  return (
    <SceneShell
      variant="results"
      eyebrow="Candidates"
      title="Candidates"
      subtitle="Track each candidate in one place."
      utility={
        <Link href={"/candidates/new" as Route}>
          <Button>Register candidate</Button>
        </Link>
      }
    >
      <div className="space-y-5">
        {params.deleted || params.error ? (
          <StagePanel className="space-y-2">
            {params.deleted ? <p className="text-sm text-emerald-200">Candidate deleted.</p> : null}
            {params.error ? <p className="text-sm text-red-200">{params.error}</p> : null}
          </StagePanel>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {trackerFilterOptions.map((option) => {
            const active = (option.value ?? "") === (status ?? "");
            const href = option.value ? (`/candidates?status=${option.value}` as Route) : ("/candidates" as Route);

            return (
              <Link key={option.label} href={href} className={chipClass(active)}>
                {option.label}
              </Link>
            );
          })}
        </div>

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
              const actionIsPrimary = action.label === "Send screener" || action.label === "Add resume";

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
                      <div className="flex flex-wrap gap-2">
                        <Link href={action.href}>
                          <Button variant={actionIsPrimary ? "primary" : "secondary"}>{action.label}</Button>
                        </Link>
                        <form action={`/api/candidates/${candidate.id}/delete`} method="post">
                          <ConfirmSubmitButton
                            variant="danger"
                            confirmMessage={`Delete ${candidate.fullName}? This removes the candidate and any linked screener data.`}
                          >
                            Delete
                          </ConfirmSubmitButton>
                        </form>
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
