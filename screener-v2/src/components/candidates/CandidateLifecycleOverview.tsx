import Link from "next/link";
import type { Route } from "next";
import { StatusPill } from "@/components/primitives/StatusPill";
import { StagePanel } from "@/components/scene/StagePanel";
import type {
  CandidateApplicationAssessmentRecord,
  CandidateApplicationRecord,
  CandidateExternalAssessmentRecord
} from "@/lib/db/candidates/types";
import type { CandidateProfilePlatformAssessment } from "@/components/candidates/CandidateAssessmentsPanel";
import {
  candidateApplicationStatusLabels,
  type ApplicationScreeningStatus,
  type CandidateApplicationStatus
} from "@/lib/jobs/types";

type LifecycleEmailLog = {
  id: string;
  status: string;
  sentAt: string;
  subject: string;
};

function applicationStatusTone(
  status: CandidateApplicationStatus
): "neutral" | "blue" | "amber" | "emerald" {
  if (status === "under_review") return "amber";
  if (status === "moved_to_pipeline") return "emerald";
  if (status === "closed") return "blue";
  return "neutral";
}

function screeningStatusTone(
  status: ApplicationScreeningStatus | null
): "neutral" | "blue" | "amber" | "emerald" {
  if (status === "passed") return "emerald";
  if (status === "failed") return "amber";
  if (status === "needs_review") return "blue";
  return "neutral";
}

function screeningStatusLabel(status: ApplicationScreeningStatus | null) {
  if (status === "passed") return "Passed";
  if (status === "failed") return "Failed";
  if (status === "needs_review") return "Needs review";
  return "Pending";
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatRelativeDay(value?: string | null) {
  if (!value) return "Not yet";
  const diff = Date.now() - Date.parse(value);
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  if (days === 0) return "Today";
  return `${days}d ago`;
}

function nextActionLabel(args: {
  hasResume: boolean;
  platformAssessments: CandidateProfilePlatformAssessment[];
  applicationAssessments: CandidateApplicationAssessmentRecord[];
  externalAssessments: CandidateExternalAssessmentRecord[];
  emailLogs: LifecycleEmailLog[];
}) {
  if (!args.hasResume) {
    return { label: "Upload resume", hrefKey: "files" as const };
  }

  if (args.platformAssessments.some((assessment) => assessment.status === "invited" || assessment.status === "in_progress")) {
    return { label: "Track active assessment", hrefKey: "assessments" as const };
  }

  if (
    args.applicationAssessments.some((assessment) => assessment.screeningStatus === "needs_review") ||
    args.externalAssessments.some((assessment) => assessment.status === "needs_review")
  ) {
    return { label: "Review assessment evidence", hrefKey: "assessments" as const };
  }

  if (args.emailLogs.length === 0) {
    return { label: "Send first candidate email", hrefKey: "emails" as const };
  }

  return { label: "Continue journey", hrefKey: "pipeline" as const };
}

function summaryValueLabel(value: number, singular: string, plural?: string) {
  if (value === 1) return `1 ${singular}`;
  return `${value} ${plural ?? `${singular}s`}`;
}

export function CandidateLifecycleSummaryCard({
  applications,
  platformAssessments,
  applicationAssessments,
  externalAssessments,
  emailLogs,
  hasResume,
  filesHref,
  assessmentsHref,
  emailsHref,
  pipelineHref
}: {
  applications: CandidateApplicationRecord[];
  platformAssessments: CandidateProfilePlatformAssessment[];
  applicationAssessments: CandidateApplicationAssessmentRecord[];
  externalAssessments: CandidateExternalAssessmentRecord[];
  emailLogs: LifecycleEmailLog[];
  hasResume: boolean;
  filesHref: Route;
  assessmentsHref: Route;
  emailsHref: Route;
  pipelineHref: Route;
}) {
  const latestApplication = applications[0] ?? null;
  const latestSentEmail =
    emailLogs.find((log) => log.status === "sent") ??
    emailLogs[0] ??
    null;
  const assessmentAction = nextActionLabel({
    hasResume,
    platformAssessments,
    applicationAssessments,
    externalAssessments,
    emailLogs
  });

  const actionHref =
    assessmentAction.hrefKey === "files"
      ? filesHref
      : assessmentAction.hrefKey === "assessments"
        ? assessmentsHref
        : assessmentAction.hrefKey === "emails"
          ? emailsHref
          : pipelineHref;

  const totalAssessments =
    platformAssessments.length + applicationAssessments.length + externalAssessments.length;

  return (
    <StagePanel tone="flat" className="space-y-0">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
        At a glance
      </h3>

      <div className="divide-y divide-[color:var(--app-border)]/60">
        <SummaryRow
          label="Next action"
          value={assessmentAction.label}
          href={actionHref}
          accent
        />
        <SummaryRow
          label="Applications"
          value={summaryValueLabel(applications.length, "application")}
          sub={latestApplication ? `Latest ${formatRelativeDay(latestApplication.updatedAt)}` : undefined}
        />
        <SummaryRow
          label="Assessments"
          value={String(totalAssessments)}
          sub={totalAssessments > 0 ? `${platformAssessments.length} platform · ${applicationAssessments.length} screening · ${externalAssessments.length} external` : undefined}
          href={totalAssessments > 0 ? assessmentsHref : undefined}
        />
        <SummaryRow
          label="Emails"
          value={summaryValueLabel(emailLogs.length, "email")}
          sub={latestSentEmail ? `Last sent ${formatRelativeDay(latestSentEmail.sentAt)}` : undefined}
          href={emailLogs.length > 0 ? emailsHref : undefined}
        />
        <SummaryRow
          label="Resume"
          value={hasResume ? "On file" : "Missing"}
          href={filesHref}
          warn={!hasResume}
        />
      </div>
    </StagePanel>
  );
}

function SummaryRow({
  label,
  value,
  sub,
  href,
  accent = false,
  warn = false,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: Route;
  accent?: boolean;
  warn?: boolean;
}) {
  const inner = (
    <div
      className={[
        "flex items-start justify-between gap-3 py-3",
        href ? "group" : "",
      ].join(" ")}
    >
      <p className="text-xs text-[color:var(--app-muted)]">{label}</p>
      <div className="text-right">
        <p
          className={[
            "text-sm font-medium leading-snug",
            accent
              ? "text-[color:var(--app-brand)]"
              : warn
                ? "text-amber-400"
                : "text-[color:var(--app-heading)]",
            href ? "group-hover:underline underline-offset-2" : "",
          ].join(" ")}
        >
          {value}
        </p>
        {sub ? (
          <p className="mt-0.5 text-[11px] text-[color:var(--app-muted)]">{sub}</p>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

export function CandidateApplicationHistoryPanel({
  applications,
  applicationAssessments
}: {
  applications: CandidateApplicationRecord[];
  applicationAssessments: CandidateApplicationAssessmentRecord[];
}) {
  if (applications.length === 0) {
    return (
      <StagePanel tone="flat" className="space-y-2">
        <h3 className="text-base font-semibold text-[color:var(--app-heading)]">Application history</h3>
        <p className="text-sm text-[color:var(--app-muted)]">
          No application submissions are linked to this record yet.
        </p>
      </StagePanel>
    );
  }

  const assessmentByJobId = new Map(
    applicationAssessments.map((assessment) => [assessment.jobPostingId, assessment])
  );

  return (
    <StagePanel tone="flat" className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[color:var(--app-heading)]">Application history</h3>
        <p className="text-sm text-[color:var(--app-muted)]">
          Every linked job submission and the intake screening outcome attached to it.
        </p>
      </div>

      <div className="space-y-3">
        {applications.map((application) => {
          const screening = assessmentByJobId.get(application.jobPostingId);
          return (
            <div
              key={application.id}
              className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[color:var(--app-heading)]">{application.jobTitle}</p>
                  <p className="text-xs text-[color:var(--app-muted)]">
                    {application.roleLabel ?? "No role linked"}
                    {application.roleDepartment ? ` • ${application.roleDepartment}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill
                    label={candidateApplicationStatusLabels[application.status]}
                    tone={applicationStatusTone(application.status)}
                  />
                  {screening ? (
                    <StatusPill
                      label={`Screening ${screeningStatusLabel(screening.screeningStatus)}`}
                      tone={screeningStatusTone(screening.screeningStatus)}
                    />
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-[color:var(--app-border)] pt-4 sm:grid-cols-2 xl:grid-cols-4">
                <HistoryMeta label="Applied" value={formatShortDate(application.createdAt)} />
                <HistoryMeta label="Updated" value={formatRelativeDay(application.updatedAt)} />
                <HistoryMeta
                  label="Screening package"
                  value={screening?.screenerPresetLabel ?? (screening ? "Attached" : "Not attached")}
                />
                <HistoryMeta
                  label="Assessment status"
                  value={screening ? screeningStatusLabel(screening.screeningStatus) : "No intake screening"}
                />
              </div>
              {application.coverNote ? (
                <div className="mt-4 space-y-1.5 border-t border-[color:var(--app-border)] pt-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
                    Cover note
                  </p>
                  <p className="text-sm leading-6 text-[color:var(--app-text)]">{application.coverNote}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </StagePanel>
  );
}

function HistoryMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">{label}</p>
      <p className="text-sm text-[color:var(--app-text)]">{value}</p>
    </div>
  );
}
