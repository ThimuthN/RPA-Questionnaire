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
import type { ApplicationScreeningStatus } from "@/lib/jobs/types";

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

function SectionLabel({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
      {children}{typeof count === "number" && count > 0 ? <span className="ml-1 font-normal opacity-60">· {count}</span> : null}
    </p>
  );
}

/** Compact inline metadata line: "a · b · c" — truncates with a hover tooltip instead of a 4-col grid dump. */
function MetaLine({ items }: { items: Array<string | null | undefined> }) {
  const parts = items.filter((item): item is string => Boolean(item));
  if (parts.length === 0) return null;
  const full = parts.join("  ·  ");
  return (
    <p className="truncate text-xs text-[color:var(--app-muted)]" title={full}>
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 ? <span className="mx-1.5 opacity-40">·</span> : null}
          {part}
        </span>
      ))}
    </p>
  );
}

/** Hero score chip — leads the eye to the number, ATS-style. */
function ScoreChip({ value, tone = "blue" }: { value: string; tone?: "blue" | "emerald" | "red" | "amber" }) {
  const toneClass = {
    blue: "border-[color:var(--pill-blue-border)] bg-[color:var(--pill-blue-bg)] text-[color:var(--pill-blue-text)]",
    emerald: "border-[color:var(--pill-emerald-border)] bg-[color:var(--pill-emerald-bg)] text-[color:var(--pill-emerald-text)]",
    red: "border-[color:var(--pill-red-border)] bg-[color:var(--pill-red-bg)] text-[color:var(--pill-red-text)]",
    amber: "border-[color:var(--pill-amber-border)] bg-[color:var(--pill-amber-bg)] text-[color:var(--pill-amber-text)]"
  }[tone];
  return (
    <span className={`inline-flex items-baseline gap-1 rounded-[10px] border px-2.5 py-1 text-sm font-semibold tabular-nums ${toneClass}`}>
      {value}
    </span>
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
          <div className="space-y-2.5">
            {platformAssessments.map((assessment) => (
              <div key={assessment.id} className="rounded-[14px] bg-[color:var(--app-surface-soft)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[color:var(--app-heading)]" title={assessment.title}>{assessment.title}</p>
                    <MetaLine
                      items={[
                        `Invite ${assessment.inviteSlug.toUpperCase()}`,
                        `Assigned ${new Date(assessment.createdAt).toLocaleDateString()}`,
                        assessment.startedAt ? `Started ${formatTimestamp(assessment.startedAt)}` : "Not started",
                        assessment.submittedAt ? `Submitted ${formatTimestamp(assessment.submittedAt)}` : "Not submitted"
                      ]}
                    />
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <CandidateAssessmentPill status={assessment.status} />
                    {typeof assessment.finalPercent === "number" ? (
                      <ScoreChip value={`${assessment.finalPercent.toFixed(1)}`} />
                    ) : null}
                  </div>
                </div>

                {assessment.resultHref ? (
                  <Link
                    href={assessment.resultHref as never}
                    className="mt-3 inline-block text-sm font-medium text-[color:var(--app-brand)] hover:underline"
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
          <div className="space-y-2.5">
            {applicationAssessments.map((application) => (
              <div
                key={application.id}
                className="rounded-[14px] bg-[color:var(--app-surface-soft)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[color:var(--app-heading)]" title={application.jobTitle}>{application.jobTitle}</p>
                    <MetaLine
                      items={[
                        application.roleLabel,
                        application.screenerPresetLabel,
                        `Submitted ${new Date(application.createdAt).toLocaleDateString()}`,
                        application.screeningAddonResults.length > 0
                          ? `${application.screeningAddonResults.length} package${application.screeningAddonResults.length === 1 ? "" : "s"}`
                          : null
                      ]}
                    />
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <StatusPill
                      label={screeningResultLabel(application.screeningStatus)}
                      tone={screeningResultTone(application.screeningStatus)}
                    />
                  </div>
                </div>

                {application.screeningAddonResults.length > 0 ? (
                  <div className="mt-3 space-y-2 border-t border-[color:var(--app-border)]/60 pt-3">
                    {application.screeningAddonResults.map((addon, index) => {
                      const scoreTone = addon.status === "passed" ? "emerald" : addon.status === "failed" ? "red" : "blue";
                      return (
                        <div
                          key={`${application.id}:${addon.addonLabel}:${index}`}
                          className="rounded-[10px] bg-[color:var(--app-surface)] px-3 py-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[color:var(--app-heading)]" title={addon.addonLabel}>{addon.addonLabel}</p>
                              <MetaLine
                                items={[
                                  addon.isMandatory ? "Required" : "Optional",
                                  addon.weight > 0 ? `Weight ${addon.weight}` : null,
                                  `Pass mark ${formatPercent(addon.requiredPercent)}`,
                                  `${addon.pointsEarned}/${addon.pointsPossible} pts`,
                                  `${addon.responses.length} response${addon.responses.length === 1 ? "" : "s"}`
                                ]}
                              />
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-2">
                              <StatusPill
                                label={screeningResultLabel(addon.status)}
                                tone={screeningResultTone(addon.status)}
                              />
                              <ScoreChip value={formatPercent(addon.applicantPercent)} tone={scoreTone} />
                            </div>
                          </div>
                          <ScreeningResponsesDisclosure responses={addon.responses} />
                        </div>
                      );
                    })}
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
          <div className="space-y-2.5">
            {externalAssessments.map((ext) => (
              <div key={ext.id} className="rounded-[14px] bg-[color:var(--app-surface-soft)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[color:var(--app-heading)]" title={ext.title}>{ext.title}</p>
                    <MetaLine
                      items={[
                        ext.sourceLabel,
                        `Recorded ${new Date(ext.createdAt).toLocaleDateString()}`,
                        ext.completedAt ? `Completed ${new Date(ext.completedAt).toLocaleDateString()}` : null,
                        ext.attachments.length > 0 ? `${ext.attachments.length} file${ext.attachments.length === 1 ? "" : "s"}` : null
                      ]}
                    />
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <StatusPill label={externalStatusLabel(ext.status)} tone={externalStatusTone(ext.status)} />
                    {typeof ext.scorePercent === "number" && (
                      <ScoreChip value={ext.scoreLabel ?? `${ext.scorePercent.toFixed(1)}%`} />
                    )}
                  </div>
                </div>

                {ext.summary && (
                  <p className="mt-3 border-t border-[color:var(--app-border)]/60 pt-3 text-sm leading-relaxed text-[color:var(--app-muted)]">
                    {ext.summary}
                  </p>
                )}

                {ext.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-[color:var(--app-border)]/60 pt-3">
                    {ext.attachments.map((file) => (
                      <a
                        key={file.id}
                        href={file.storageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--app-surface)] px-3 py-1 text-xs font-medium text-[color:var(--app-heading)] transition hover:text-[color:var(--app-brand)]"
                      >
                        {file.fileName}
                        <span className="text-[color:var(--app-muted)]">({(file.sizeBytes / 1024).toFixed(0)} KB)</span>
                      </a>
                    ))}
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
