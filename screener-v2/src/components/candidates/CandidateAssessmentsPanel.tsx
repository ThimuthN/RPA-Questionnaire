import Link from "next/link";
import { CandidateAssessmentPill } from "@/components/candidates/CandidatePills";
import { StatusPill } from "@/components/primitives/StatusPill";
import { StagePanel } from "@/components/scene/StagePanel";
import { LogExternalAssessmentForm } from "@/components/candidates/LogExternalAssessmentForm";
import { ScreeningResponsesDisclosure } from "@/components/candidates/ScreeningResponsesDisclosure";
import type {
  CandidateApplicationAssessmentRecord,
  CandidateAssessmentRecord,
  CandidateExternalAssessmentRecord
} from "@/lib/db/candidates/types";
import {
  candidateApplicationStatusLabels,
  type ApplicationScreeningStatus
} from "@/lib/jobs/types";

export type CandidateProfilePlatformAssessment = CandidateAssessmentRecord & {
  title: string;
  resultHref?: string;
};

function screeningResultTone(
  status: ApplicationScreeningStatus | null
): "neutral" | "blue" | "amber" | "emerald" {
  if (status === "passed") return "emerald";
  if (status === "failed") return "amber";
  if (status === "needs_review") return "blue";
  return "neutral";
}

function screeningResultLabel(status: ApplicationScreeningStatus | null): string {
  if (status === "passed") return "Passed";
  if (status === "failed") return "Failed";
  if (status === "needs_review") return "Needs review";
  return "Not submitted";
}

function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function formatTimestamp(value?: string) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

function AssessmentMeta({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
        {label}
      </p>
      <p className="text-sm text-[color:var(--app-text)]">{value}</p>
    </div>
  );
}

function externalStatusTone(status: string): "neutral" | "blue" | "emerald" | "amber" | "red" {
  if (status === "passed") return "emerald";
  if (status === "failed") return "red";
  if (status === "needs_review") return "amber";
  if (status === "completed") return "blue";
  return "neutral";
}

function externalStatusLabel(status: string): string {
  const map: Record<string, string> = {
    passed: "Passed",
    failed: "Failed",
    needs_review: "Needs review",
    completed: "Completed",
    pending: "Pending"
  };
  return map[status] ?? status;
}

export function CandidateAssessmentsPanel({
  candidateId,
  platformAssessments,
  applicationAssessments,
  externalAssessments,
  canManage = false
}: {
  candidateId: string;
  platformAssessments: CandidateProfilePlatformAssessment[];
  applicationAssessments: CandidateApplicationAssessmentRecord[];
  externalAssessments: CandidateExternalAssessmentRecord[];
  canManage?: boolean;
}) {
  const totalCount = platformAssessments.length + applicationAssessments.length + externalAssessments.length;

  if (totalCount === 0 && !canManage) {
    return (
      <StagePanel tone="flat">
        <p className="text-sm text-[color:var(--app-muted)]">
          No assessments have been assigned or recorded for this profile yet.
        </p>
      </StagePanel>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <StatusPill
          label={`${platformAssessments.length} platform`}
          tone="blue"
        />
        <StatusPill
          label={`${applicationAssessments.length} screening`}
          tone="teal"
        />
        <StatusPill
          label={`${externalAssessments.length} external`}
          tone="neutral"
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-[color:var(--app-heading)]">
            Platform assessments
          </h3>
          <p className="text-sm text-[color:var(--app-muted)]">
            Invite-backed tests, pending completions, and scored results.
          </p>
        </div>

        {platformAssessments.length === 0 ? (
          <StagePanel tone="flat">
            <p className="text-sm text-[color:var(--app-muted)]">
              No platform assessments have been assigned yet.
            </p>
          </StagePanel>
        ) : (
          <div className="space-y-4">
            {platformAssessments.map((assessment) => (
              <StagePanel key={assessment.id} tone="flat" className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-[color:var(--app-heading)]">
                      {assessment.title}
                    </h4>
                    <p className="text-xs text-[color:var(--app-muted)]">
                      Invite code {assessment.inviteSlug.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CandidateAssessmentPill status={assessment.status} />
                    {typeof assessment.finalPercent === "number" ? (
                      <StatusPill
                        label={`${assessment.finalPercent.toFixed(1)} / 100`}
                        tone="blue"
                      />
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 border-t border-[color:var(--app-border)] pt-4 sm:grid-cols-2 xl:grid-cols-4">
                  <AssessmentMeta
                    label="Assigned"
                    value={new Date(assessment.createdAt).toLocaleDateString()}
                  />
                  <AssessmentMeta
                    label="Started"
                    value={formatTimestamp(assessment.startedAt) ?? "Not started"}
                  />
                  <AssessmentMeta
                    label="Submitted"
                    value={formatTimestamp(assessment.submittedAt) ?? "Pending"}
                  />
                  <AssessmentMeta
                    label="Result"
                    value={
                      typeof assessment.finalPercent === "number"
                        ? `${assessment.finalPercent.toFixed(1)} / 100`
                        : "Awaiting submission"
                    }
                  />
                </div>

                {assessment.resultHref ? (
                  <div className="border-t border-[color:var(--app-border)] pt-4">
                    <Link
                      href={assessment.resultHref as never}
                      className="text-sm font-medium text-[color:var(--app-brand)] hover:text-[color:var(--app-brand-strong)]"
                    >
                      Open result
                    </Link>
                  </div>
                ) : null}
              </StagePanel>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-[color:var(--app-heading)]">
            Application screening
          </h3>
          <p className="text-sm text-[color:var(--app-muted)]">
            Job-attached screening assessments completed during application intake.
          </p>
        </div>

        {applicationAssessments.length === 0 ? (
          <StagePanel tone="flat">
            <p className="text-sm text-[color:var(--app-muted)]">
              No application screening assessments have been recorded.
            </p>
          </StagePanel>
        ) : (
          <div className="space-y-4">
            {applicationAssessments.map((application) => (
              <StagePanel key={application.id} tone="flat" className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-[color:var(--app-heading)]">
                      {application.jobTitle}
                    </h4>
                    <p className="text-xs text-[color:var(--app-muted)]">
                      {application.screenerPresetLabel
                        ? `${application.screenerPresetLabel} • Submitted ${new Date(application.createdAt).toLocaleDateString()}`
                        : `Submitted ${new Date(application.createdAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill
                      label={screeningResultLabel(application.screeningStatus)}
                      tone={screeningResultTone(application.screeningStatus)}
                    />
                    <StatusPill
                      label={candidateApplicationStatusLabels[application.status]}
                      tone="neutral"
                    />
                  </div>
                </div>

                <div className="grid gap-3 border-t border-[color:var(--app-border)] pt-4 sm:grid-cols-2 xl:grid-cols-4">
                  <AssessmentMeta label="Role" value={application.roleLabel ?? "Not assigned"} />
                  <AssessmentMeta
                    label="Job stage"
                    value={candidateApplicationStatusLabels[application.status]}
                  />
                  <AssessmentMeta
                    label="Assessment status"
                    value={screeningResultLabel(application.screeningStatus)}
                  />
                  <AssessmentMeta
                    label="Packages"
                    value={String(application.screeningAddonResults.length)}
                  />
                </div>

                <div className="space-y-3 border-t border-[color:var(--app-border)] pt-4">
                  {application.screeningAddonResults.map((addon, index) => (
                    <div
                      key={`${application.id}:${addon.addonLabel}:${index}`}
                      className="rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-[color:var(--app-heading)]">
                            {addon.addonLabel}
                          </p>
                          <p className="text-xs text-[color:var(--app-muted)]">
                            {addon.isMandatory ? "Required" : "Optional"}
                            {addon.weight > 0 ? ` • Weight ${addon.weight}` : ""}
                            {!addon.inlineSupported ? " • Needs manual review" : ""}
                          </p>
                        </div>
                        <StatusPill
                          label={screeningResultLabel(addon.status)}
                          tone={screeningResultTone(addon.status)}
                        />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-4">
                        <AssessmentMeta
                          label="Required"
                          value={formatPercent(addon.requiredPercent)}
                        />
                        <AssessmentMeta
                          label="Score"
                          value={formatPercent(addon.applicantPercent)}
                        />
                        <AssessmentMeta
                          label="Points"
                          value={`${addon.pointsEarned} / ${addon.pointsPossible}`}
                        />
                        <AssessmentMeta
                          label="Responses"
                          value={String(addon.responses.length)}
                        />
                      </div>

                      <ScreeningResponsesDisclosure responses={addon.responses} />
                    </div>
                  ))}
                </div>
              </StagePanel>
            ))}
          </div>
        )}
      </div>

      {/* External / off-platform assessments */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-[color:var(--app-heading)]">
            External assessments
          </h3>
          <p className="text-sm text-[color:var(--app-muted)]">
            Off-platform tests, take-home exercises, and manually recorded evaluation results.
          </p>
        </div>

        {externalAssessments.length > 0 && (
          <div className="space-y-4">
            {externalAssessments.map((ext) => (
              <StagePanel key={ext.id} tone="flat" className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-[color:var(--app-heading)]">
                      {ext.title}
                    </h4>
                    {ext.sourceLabel && (
                      <p className="text-xs text-[color:var(--app-muted)]">{ext.sourceLabel}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill
                      label={externalStatusLabel(ext.status)}
                      tone={externalStatusTone(ext.status)}
                    />
                    {typeof ext.scorePercent === "number" && (
                      <StatusPill
                        label={ext.scoreLabel ?? `${ext.scorePercent.toFixed(1)}%`}
                        tone="blue"
                      />
                    )}
                  </div>
                </div>

                <div className="grid gap-3 border-t border-[color:var(--app-border)] pt-4 sm:grid-cols-2 xl:grid-cols-4">
                  <AssessmentMeta
                    label="Recorded"
                    value={new Date(ext.createdAt).toLocaleDateString()}
                  />
                  <AssessmentMeta
                    label="Completed"
                    value={ext.completedAt ? new Date(ext.completedAt).toLocaleDateString() : "Not set"}
                  />
                  <AssessmentMeta
                    label="Score"
                    value={
                      typeof ext.scorePercent === "number"
                        ? ext.scoreLabel ?? `${ext.scorePercent.toFixed(1)}%`
                        : "—"
                    }
                  />
                  <AssessmentMeta label="Files" value={String(ext.attachments.length)} />
                </div>

                {ext.summary && (
                  <p className="border-t border-[color:var(--app-border)] pt-4 text-sm leading-relaxed text-[color:var(--app-muted)]">
                    {ext.summary}
                  </p>
                )}

                {ext.attachments.length > 0 && (
                  <div className="space-y-2 border-t border-[color:var(--app-border)] pt-4">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
                      Attachments
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ext.attachments.map((file) => (
                        <a
                          key={file.id}
                          href={file.storageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-1 text-xs font-medium text-[color:var(--app-heading)] transition hover:bg-[color:var(--app-surface-muted)]"
                        >
                          {file.fileName}
                          <span className="text-[color:var(--app-muted)]">
                            ({(file.sizeBytes / 1024).toFixed(0)} KB)
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </StagePanel>
            ))}
          </div>
        )}

        {canManage && (
          <LogExternalAssessmentForm candidateId={candidateId} />
        )}

        {externalAssessments.length === 0 && !canManage && (
          <StagePanel tone="flat">
            <p className="text-sm text-[color:var(--app-muted)]">
              No external assessments have been recorded.
            </p>
          </StagePanel>
        )}
      </div>
    </div>
  );
}
