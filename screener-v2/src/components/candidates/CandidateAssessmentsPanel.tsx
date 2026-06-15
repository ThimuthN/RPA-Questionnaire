import Link from "next/link";
import { CandidateAssessmentPill } from "@/components/candidates/CandidatePills";
import { StatusPill } from "@/components/primitives/StatusPill";
import { LogExternalAssessmentForm } from "@/components/candidates/LogExternalAssessmentForm";
import { ExternalAssessmentUploadLink } from "@/components/candidates/ExternalAssessmentUploadLink";
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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">{label}</p>
      <p className="text-sm text-[color:var(--app-text)]">{value}</p>
    </div>
  );
}

function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
      {children}{typeof count === "number" && count > 0 ? <span className="ml-1 font-normal opacity-60">· {count}</span> : null}
    </p>
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
  candidateEmail,
  platformAssessments,
  applicationAssessments,
  externalAssessments,
  canManage = false
}: {
  candidateId: string;
  candidateEmail?: string;
  platformAssessments: CandidateProfilePlatformAssessment[];
  applicationAssessments: CandidateApplicationAssessmentRecord[];
  externalAssessments: CandidateExternalAssessmentRecord[];
  canManage?: boolean;
}) {
  const totalCount = platformAssessments.length + applicationAssessments.length + externalAssessments.length;

  if (totalCount === 0 && !canManage) {
    return (
      <p className="py-4 text-sm text-[color:var(--app-muted)]">
        No assessments have been assigned or recorded for this profile yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Platform assessments ── */}
      <div className="space-y-3">
        <SectionLabel count={platformAssessments.length}>Platform assessments</SectionLabel>

        {platformAssessments.length === 0 ? (
          <p className="text-sm text-[color:var(--app-muted)]">No platform assessments assigned yet.</p>
        ) : (
          <div className="divide-y divide-[color:var(--app-border)] rounded-[16px] border border-[color:var(--app-border)]">
            {platformAssessments.map((assessment) => (
              <div key={assessment.id} className="space-y-3 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">{assessment.title}</p>
                    <p className="text-xs text-[color:var(--app-muted)]">
                      Invite {assessment.inviteSlug.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CandidateAssessmentPill status={assessment.status} />
                    {typeof assessment.finalPercent === "number" ? (
                      <StatusPill label={`${assessment.finalPercent.toFixed(1)} / 100`} tone="blue" />
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 border-t border-[color:var(--app-border)] pt-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetaRow label="Assigned" value={new Date(assessment.createdAt).toLocaleDateString()} />
                  <MetaRow label="Started" value={formatTimestamp(assessment.startedAt) ?? "Not started"} />
                  <MetaRow label="Submitted" value={formatTimestamp(assessment.submittedAt) ?? "Pending"} />
                  <MetaRow
                    label="Result"
                    value={typeof assessment.finalPercent === "number" ? `${assessment.finalPercent.toFixed(1)} / 100` : "Awaiting"}
                  />
                </div>

                {assessment.resultHref ? (
                  <Link
                    href={assessment.resultHref as never}
                    className="text-sm font-medium text-[color:var(--app-brand)] hover:underline"
                  >
                    Open result →
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Application screening ── */}
      <div className="space-y-3">
        <SectionLabel count={applicationAssessments.length}>Application screening</SectionLabel>

        {applicationAssessments.length === 0 ? (
          <p className="text-sm text-[color:var(--app-muted)]">No screening assessments recorded.</p>
        ) : (
          <div className="space-y-3">
            {applicationAssessments.map((application) => (
              <div
                key={application.id}
                className="rounded-[14px] border border-[color:var(--app-border)] p-4 space-y-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">{application.jobTitle}</p>
                    <p className="text-xs text-[color:var(--app-muted)]">
                      {application.screenerPresetLabel
                        ? `${application.screenerPresetLabel} · Submitted ${new Date(application.createdAt).toLocaleDateString()}`
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

                <div className="grid gap-3 border-t border-[color:var(--app-border)] pt-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetaRow label="Role" value={application.roleLabel ?? "—"} />
                  <MetaRow label="Job stage" value={candidateApplicationStatusLabels[application.status]} />
                  <MetaRow label="Screening" value={screeningResultLabel(application.screeningStatus)} />
                  <MetaRow label="Packages" value={String(application.screeningAddonResults.length)} />
                </div>

                {application.screeningAddonResults.length > 0 ? (
                  <div className="border-t border-[color:var(--app-border)] pt-1">
                    {application.screeningAddonResults.map((addon, index) => (
                      <div
                        key={`${application.id}:${addon.addonLabel}:${index}`}
                        className="border-b border-[color:var(--app-border)]/50 py-3 last:border-0"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium text-[color:var(--app-heading)]">{addon.addonLabel}</p>
                            <p className="text-xs text-[color:var(--app-muted)]">
                              {addon.isMandatory ? "Required" : "Optional"}
                              {addon.weight > 0 ? ` · Weight ${addon.weight}` : ""}
                            </p>
                          </div>
                          <StatusPill
                            label={screeningResultLabel(addon.status)}
                            tone={screeningResultTone(addon.status)}
                          />
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-4">
                          <MetaRow label="Required" value={formatPercent(addon.requiredPercent)} />
                          <MetaRow label="Score" value={formatPercent(addon.applicantPercent)} />
                          <MetaRow label="Points" value={`${addon.pointsEarned} / ${addon.pointsPossible}`} />
                          <MetaRow label="Responses" value={String(addon.responses.length)} />
                        </div>

                        <ScreeningResponsesDisclosure responses={addon.responses} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── External assessments ── */}
      <div className="space-y-3">
        <SectionLabel count={externalAssessments.length}>External assessments</SectionLabel>

        {externalAssessments.length > 0 && (
          <div className="divide-y divide-[color:var(--app-border)] rounded-[16px] border border-[color:var(--app-border)]">
            {externalAssessments.map((ext) => (
              <div key={ext.id} className="space-y-3 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">{ext.title}</p>
                    {ext.sourceLabel && (
                      <p className="text-xs text-[color:var(--app-muted)]">{ext.sourceLabel}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill label={externalStatusLabel(ext.status)} tone={externalStatusTone(ext.status)} />
                    {typeof ext.scorePercent === "number" && (
                      <StatusPill label={ext.scoreLabel ?? `${ext.scorePercent.toFixed(1)}%`} tone="blue" />
                    )}
                  </div>
                </div>

                <div className="grid gap-3 border-t border-[color:var(--app-border)] pt-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetaRow label="Recorded" value={new Date(ext.createdAt).toLocaleDateString()} />
                  <MetaRow label="Completed" value={ext.completedAt ? new Date(ext.completedAt).toLocaleDateString() : "—"} />
                  <MetaRow
                    label="Score"
                    value={typeof ext.scorePercent === "number" ? ext.scoreLabel ?? `${ext.scorePercent.toFixed(1)}%` : "—"}
                  />
                  <MetaRow label="Files" value={String(ext.attachments.length)} />
                </div>

                {ext.summary && (
                  <p className="border-t border-[color:var(--app-border)] pt-3 text-sm leading-relaxed text-[color:var(--app-muted)]">
                    {ext.summary}
                  </p>
                )}

                {ext.attachments.length > 0 && (
                  <div className="border-t border-[color:var(--app-border)] pt-3">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {ext.attachments.map((file) => (
                        <a
                          key={file.id}
                          href={file.storageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--app-border)] px-3 py-1 text-xs font-medium text-[color:var(--app-heading)] transition hover:border-[color:var(--app-brand)]/40 hover:text-[color:var(--app-brand)]"
                        >
                          {file.fileName}
                          <span className="text-[color:var(--app-muted)]">({(file.sizeBytes / 1024).toFixed(0)} KB)</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {canManage && (
                  <ExternalAssessmentUploadLink
                    candidateId={candidateId}
                    assessmentId={ext.id}
                    candidateEmail={candidateEmail}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {externalAssessments.length === 0 && !canManage && (
          <p className="text-sm text-[color:var(--app-muted)]">No external assessments recorded.</p>
        )}

        {canManage && (
          <LogExternalAssessmentForm candidateId={candidateId} />
        )}
      </div>
    </div>
  );
}
