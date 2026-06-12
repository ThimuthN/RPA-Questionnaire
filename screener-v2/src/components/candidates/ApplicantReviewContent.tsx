import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { ResumePreviewModal } from "@/components/candidates/ResumePreviewModal";
import { ResponsibleTeamCard } from "@/components/candidates/ResponsibleTeamCard";
import { StatusPill } from "@/components/primitives/StatusPill";
import { StagePanel } from "@/components/scene/StagePanel";
import { candidateApplicationStatusLabels, type ApplicationScreeningStatus } from "@/lib/jobs/types";

type ApplicantReviewDetail = Awaited<ReturnType<typeof import("@/lib/db/jobs").getApplicantReviewDetail>>;
type TeamTemplate = Awaited<
  ReturnType<typeof import("@/lib/db/hiring-team-templates").listDepartmentHiringTeamOptions>
>["templates"][number];
type TeamUser = Awaited<
  ReturnType<typeof import("@/lib/db/hiring-team-templates").listDepartmentHiringTeamOptions>
>["users"][number];
type ApplicationAssignment = Awaited<
  ReturnType<typeof import("@/lib/db/hiring-assignments").getApplicationAssignments>
>[number];

function applicationTone(status: string): "neutral" | "blue" | "amber" | "emerald" {
  if (status === "under_review") return "amber";
  if (status === "moved_to_pipeline") return "emerald";
  if (status === "closed") return "blue";
  return "neutral";
}

function screeningTone(
  status: ApplicationScreeningStatus | null
): "neutral" | "blue" | "amber" | "emerald" {
  if (status === "passed") return "emerald";
  if (status === "failed") return "amber";
  if (status === "needs_review") return "blue";
  return "neutral";
}

function screeningLabel(status: ApplicationScreeningStatus | null): string {
  if (status === "passed") return "Passed";
  if (status === "failed") return "Failed";
  if (status === "needs_review") return "Needs review";
  return "Not submitted";
}

function formatPercent(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Not scored";
  }

  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function NoticeBanner({
  tone,
  children
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  const className =
    tone === "success"
      ? "rounded-[20px] border border-[color:var(--app-success)]/30 bg-[color:var(--app-success)]/10 p-4 text-sm text-white"
      : "rounded-[20px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger)]/10 p-4 text-sm text-white";

  return <div className={className}>{children}</div>;
}

export function ApplicantReviewContent({
  detail,
  pageState,
  backToApplicantsHref,
  reviewHref,
  candidateProfileHref,
  assignments,
  templates,
  users,
  canManageApplications,
  canMoveToPipeline
}: {
  detail: NonNullable<ApplicantReviewDetail>;
  pageState: { updated?: string; error?: string };
  backToApplicantsHref: Route;
  reviewHref: Route;
  candidateProfileHref: Route;
  assignments: ApplicationAssignment[];
  templates: TeamTemplate[];
  users: TeamUser[];
  canManageApplications: boolean;
  canMoveToPipeline: boolean;
}) {
  const previewUrl = detail.latestResume
    ? `/api/candidates/${detail.candidate.id}/resume/file?storageKey=${encodeURIComponent(detail.latestResume.storageKey)}`
    : null;
  const downloadUrl = detail.latestResume
    ? `/api/candidates/${detail.candidate.id}/resume/file?storageKey=${encodeURIComponent(detail.latestResume.storageKey)}&download=1`
    : null;
  const hasAssignedPanel = assignments.length > 0;

  return (
    <div className="space-y-5">
      {pageState.updated ? <NoticeBanner tone="success">Application updated.</NoticeBanner> : null}
      {pageState.error ? <NoticeBanner tone="error">{pageState.error}</NoticeBanner> : null}

      <StagePanel className="space-y-5 overflow-hidden bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_16%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-brand)]">Applicant review</p>
            <h2 className="text-2xl text-[color:var(--app-heading)]">Review this application</h2>
            <p className="max-w-2xl text-sm text-[color:var(--app-text)]">
              Review the application, allocate the hiring panel, then decide whether this person stays under review or moves into the pipeline.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusPill
              label={candidateApplicationStatusLabels[detail.status]}
              tone={applicationTone(detail.status)}
            />
            <StatusPill label={detail.candidate.stage === "applicant" ? "Applicant" : "Pipeline"} tone="blue" />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4">
            <div className="space-y-1 border-t border-[color:var(--app-border)] pt-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Applicant details</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Email</p>
                <p className="break-all text-sm text-[color:var(--app-text)]">{detail.candidate.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Phone</p>
                <p className="text-sm text-[color:var(--app-text)]">{detail.candidate.phone || "Not provided"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Panel owner</p>
                <p className="text-sm text-[color:var(--app-text)]">{detail.candidate.hrOwner || "Unassigned"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Applied for</p>
                <p className="text-sm text-[color:var(--app-text)]">{detail.job.title}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Role</p>
                <p className="text-sm text-[color:var(--app-text)]">{detail.job.roleLabel ?? "No role linked"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Applied on</p>
                <p className="text-sm text-[color:var(--app-text)]">{new Date(detail.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Resume</p>
                <p className="text-sm text-[color:var(--app-text)]">{detail.latestResume ? "Attached" : "Missing"}</p>
              </div>
            </div>

            <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Application note</p>
                <p className="text-sm leading-6 text-[color:var(--app-text)]">
                  {detail.applicationNote || "No note was added with this application."}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-[color:var(--app-border)] pt-4 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
            <ResponsibleTeamCard
              mode="application"
              entityId={detail.id}
              assignments={assignments.map((assignment) => ({
                id: assignment.id,
                user: assignment.user,
                assignmentRole: assignment.assignmentRole,
                isPrimary: assignment.isPrimary
              }))}
              users={users}
              templates={templates}
              canEdit={canManageApplications}
            />

            <section className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Decision actions</p>
                <h3 className="text-xl text-[color:var(--app-heading)]">Move the application forward</h3>
                <p className="text-sm text-[color:var(--app-muted)]">
                  Keep the application under review, move it into the pipeline, or close it. The hiring panel stays attached to the application record.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {canManageApplications ? (
                  <form action={`/api/candidate-applications/${detail.id}`} method="post">
                    <input type="hidden" name="action" value="review" />
                    <input type="hidden" name="returnTo" value={reviewHref} />
                    <Button type="submit" variant="secondary">Keep under review</Button>
                  </form>
                ) : null}

                {canMoveToPipeline ? (
                  <form action={`/api/candidate-applications/${detail.id}`} method="post">
                    <input type="hidden" name="action" value="promote" />
                    <input type="hidden" name="returnTo" value={reviewHref} />
                    <Button type="submit" disabled={!hasAssignedPanel}>Move to candidate pipeline</Button>
                  </form>
                ) : null}

                {canManageApplications ? (
                  <form action={`/api/candidate-applications/${detail.id}`} method="post">
                    <input type="hidden" name="action" value="close" />
                    <input type="hidden" name="returnTo" value={reviewHref} />
                    <Button type="submit" variant="secondary">Close application</Button>
                  </form>
                ) : null}

                <Link href={candidateProfileHref}>
                  <Button type="button" variant="ghost">Open candidate profile</Button>
                </Link>
              </div>

              {!hasAssignedPanel ? (
                <div className="rounded-[16px] border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                  Allocate a hiring panel before moving this applicant into the candidate pipeline.
                </div>
              ) : null}

              {!canManageApplications && !canMoveToPipeline ? (
                <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-3 text-sm text-[color:var(--app-muted)]">
                  You can review this application, but your role cannot change its state.
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </StagePanel>

      <StagePanel className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl text-[color:var(--app-heading)]">Application screening</h2>
            <p className="text-sm text-[color:var(--app-muted)]">
              Review screening results saved with this specific job application.
            </p>
          </div>
          {detail.screeningAddonResults.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {detail.job.screenerPresetLabel ? (
                <StatusPill label={detail.job.screenerPresetLabel} tone="blue" />
              ) : null}
              <StatusPill
                label={screeningLabel(detail.screeningStatus)}
                tone={screeningTone(detail.screeningStatus)}
              />
            </div>
          ) : null}
        </div>

        {detail.screeningAddonResults.length === 0 ? (
          <p className="text-sm text-[color:var(--app-muted)]">
            No screening responses were submitted.
          </p>
        ) : (
          <div className="space-y-4">
            {detail.screeningAddonResults.map((addon, index) => (
              <section
                key={`${addon.addonLabel}:${index}`}
                className="space-y-4 rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-[color:var(--app-heading)]">
                      {addon.addonLabel}
                    </h3>
                    <p className="text-sm text-[color:var(--app-muted)]">
                      {addon.isMandatory ? "Required" : "Optional"}
                      {addon.weight > 0 ? ` | Weight ${addon.weight}` : ""}
                      {!addon.inlineSupported ? " | Needs manual review" : ""}
                    </p>
                  </div>
                  <StatusPill
                    label={screeningLabel(addon.status)}
                    tone={screeningTone(addon.status)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                      Required score
                    </p>
                    <p className="text-sm text-[color:var(--app-text)]">
                      {formatPercent(addon.requiredPercent)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                      Applicant score
                    </p>
                    <p className="text-sm text-[color:var(--app-text)]">
                      {formatPercent(addon.applicantPercent)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                      Points
                    </p>
                    <p className="text-sm text-[color:var(--app-text)]">
                      {addon.pointsEarned} / {addon.pointsPossible}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">
                      Result
                    </p>
                    <p className="text-sm text-[color:var(--app-text)]">
                      {screeningLabel(addon.status)}
                    </p>
                  </div>
                </div>

                {addon.responses.length > 0 ? (
                  <div className="space-y-3 border-t border-[color:var(--app-border)] pt-4">
                    {addon.responses.map((response) => (
                      <div
                        key={`${addon.addonLabel}:${response.questionKey}`}
                        className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-[color:var(--app-heading)]">
                              {response.questionLabel}
                            </p>
                            <p className="text-xs text-[color:var(--app-muted)]">
                              {response.formatLabel}
                            </p>
                          </div>
                          <p className="text-xs text-[color:var(--app-muted)]">
                            {response.pointsEarned} / {response.pointsPossible}
                          </p>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--app-text)]">
                          {response.answerText || "No answer submitted."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[color:var(--app-muted)]">
                    No screening responses were submitted.
                  </p>
                )}
              </section>
            ))}
          </div>
        )}
      </StagePanel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <StagePanel className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl text-[color:var(--app-heading)]">Job context</h2>
            <p className="text-sm text-[color:var(--app-muted)]">Keep the role details close while you review.</p>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-[color:var(--app-muted)]">{detail.job.summary}</p>
            <div className="whitespace-pre-wrap text-sm leading-7 text-[color:var(--app-text)]">{detail.job.description}</div>
          </div>
        </StagePanel>

        <div className="space-y-4">
          <StagePanel tone="summary" className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl text-[color:var(--app-heading)]">Resume</h2>
              <p className="text-sm text-[color:var(--app-muted)]">Open the applicant resume from here.</p>
            </div>
            {detail.latestResume ? (
              <>
                <p className="text-sm text-[color:var(--app-heading)]">{detail.latestResume.fileName}</p>
                <p className="text-xs text-[color:var(--app-muted)]">
                  {Math.max(1, Math.round(detail.latestResume.sizeBytes / 1024))} KB | Uploaded{" "}
                  {new Date(detail.latestResume.uploadedAt).toLocaleDateString()}
                </p>
                <div className="flex flex-wrap gap-2">
                  {previewUrl ? (
                    <ResumePreviewModal
                      fileName={detail.latestResume.fileName}
                      previewUrl={previewUrl}
                      downloadUrl={downloadUrl}
                    />
                  ) : null}
                  <a href={downloadUrl ?? "#"} target="_blank" rel="noreferrer">
                    <Button type="button" variant="secondary">
                      Download PDF
                    </Button>
                  </a>
                </div>
              </>
            ) : (
              <p className="text-sm text-[color:var(--app-muted)]">No resume uploaded with this application.</p>
            )}
          </StagePanel>

          <div className="flex flex-wrap gap-2">
            <Link href={backToApplicantsHref}>
              <Button variant="secondary">Back to applicants</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
