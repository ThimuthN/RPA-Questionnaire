import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";

type NextAction = {
  kind: "primary" | "warning" | "done";
  label: string;
  description: string;
  href?: Route;
  ctaLabel?: string;
};

function resolveNextAction({
  hasResume,
  hasLinkedJourney,
  hasTeam,
  latestAssessmentStatus,
  assessmentsHref,
  filesHref,
  pipelineHref,
  offerStatus,
  offerHref,
  candidateStage,
}: {
  hasResume: boolean;
  hasLinkedJourney: boolean;
  hasTeam: boolean;
  latestAssessmentStatus: string | null;
  assessmentsHref: Route;
  filesHref: Route;
  pipelineHref: Route;
  offerStatus?: string | null;
  offerHref: Route;
  candidateStage: string;
}): NextAction | null {
  if (candidateStage === "finalized") return null;

  if (!hasLinkedJourney) {
    return {
      kind: "warning",
      label: "No linked role",
      description: "Assign an application or candidacy to start the hiring process.",
      href: pipelineHref,
      ctaLabel: "Open pipeline",
    };
  }

  if (!hasTeam) {
    return {
      kind: "warning",
      label: "Hiring team missing",
      description: "Assign a hiring team member before scheduling interviews or sending assessments.",
      href: pipelineHref,
      ctaLabel: "Assign team",
    };
  }

  if (!hasResume) {
    return {
      kind: "primary",
      label: "Resume not on file",
      description: "Upload or request the candidate's resume to proceed with evaluation.",
      href: filesHref,
      ctaLabel: "Upload resume",
    };
  }

  if (latestAssessmentStatus === "none" || latestAssessmentStatus === null) {
    return {
      kind: "primary",
      label: "No assessment assigned",
      description: "Send a skills assessment to get an objective signal on this candidate.",
      href: assessmentsHref,
      ctaLabel: "Assign assessment",
    };
  }

  if (latestAssessmentStatus === "invited" || latestAssessmentStatus === "started") {
    return {
      kind: "done",
      label: "Assessment in progress",
      description: "Waiting for the candidate to complete their assessment. No action needed right now.",
    };
  }

  if (latestAssessmentStatus === "completed") {
    return {
      kind: "primary",
      label: "Review assessment results",
      description: "Assessment submitted — review the results and decide on next steps.",
      href: assessmentsHref,
      ctaLabel: "Review results",
    };
  }

  if ((candidateStage === "interview" || candidateStage === "advanced_review") && (!offerStatus || offerStatus === "draft")) {
    return {
      kind: "primary",
      label: "Ready for offer",
      description: "Candidate has reached the final stages. Prepare and send an offer when ready.",
      href: offerHref,
      ctaLabel: "Prepare offer",
    };
  }

  return null;
}

export function NextActionCard({
  hasResume,
  hasLinkedJourney,
  hasTeam,
  latestAssessmentStatus,
  assessmentsHref,
  filesHref,
  pipelineHref,
  offerStatus,
  offerHref,
  candidateStage,
}: {
  hasResume: boolean;
  hasLinkedJourney: boolean;
  hasTeam: boolean;
  latestAssessmentStatus: string | null;
  assessmentsHref: Route;
  filesHref: Route;
  pipelineHref: Route;
  offerStatus?: string | null;
  offerHref: Route;
  candidateStage: string;
}) {
  const action = resolveNextAction({
    hasResume,
    hasLinkedJourney,
    hasTeam,
    latestAssessmentStatus,
    assessmentsHref,
    filesHref,
    pipelineHref,
    offerStatus,
    offerHref,
    candidateStage,
  });

  if (!action) return null;

  const isPrimary = action.kind === "primary";
  const isWarning = action.kind === "warning";
  const isDone = action.kind === "done";

  return (
    <div
      className={[
        "flex items-start justify-between gap-4 rounded-[20px] border px-5 py-4",
        isPrimary
          ? "border-[color:var(--pill-teal-border)] bg-[linear-gradient(135deg,var(--pill-teal-bg),color-mix(in_srgb,var(--pill-blue-bg)_50%,transparent))]"
          : isWarning
          ? "border-[color:var(--app-warning)]/30 bg-[color:var(--app-warning-soft)]"
          : "border-[color:var(--app-success)]/30 bg-[color:var(--app-success-soft)]",
      ].join(" ")}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 flex-shrink-0">
          {isDone ? (
            <CheckCircle2 className="h-4 w-4 text-[color:var(--app-success)]" />
          ) : isWarning ? (
            <AlertTriangle className="h-4 w-4 text-[color:var(--app-warning)]" />
          ) : (
            <div className="h-2 w-2 mt-1 rounded-full bg-[color:var(--app-brand)] ring-4 ring-[color:var(--app-brand)]/20" />
          )}
        </div>
        <div className="min-w-0 space-y-0.5">
          <p
            className={[
              "text-sm font-semibold",
              isPrimary
                ? "text-[color:var(--pill-teal-text)]"
                : isWarning
                ? "text-[color:var(--app-warning)]"
                : "text-[color:var(--app-success)]",
            ].join(" ")}
          >
            {action.label}
          </p>
          <p className="text-xs text-[color:var(--app-muted)] leading-relaxed">{action.description}</p>
        </div>
      </div>
      {action.href && action.ctaLabel ? (
        <Link
          href={action.href}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-[color:var(--app-brand)] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_6px_18px_color-mix(in_srgb,var(--app-brand)_28%,transparent)] transition hover:brightness-110 hover:-translate-y-[1px]"
        >
          {action.ctaLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      ) : null}
    </div>
  );
}
