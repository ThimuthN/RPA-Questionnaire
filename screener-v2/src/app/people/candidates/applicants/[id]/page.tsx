import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { FormInput } from "@/components/primitives/FormInput";
import { CandidatesViewSwitch } from "@/components/candidates/CandidatesViewSwitch";
import { ResumePreviewModal } from "@/components/candidates/ResumePreviewModal";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { requirePageSession } from "@/lib/auth/guards";
import { canUsePermissionForDepartment } from "@/lib/auth/permission-evaluator";
import { getApplicantReviewDetail } from "@/lib/db/jobs";
import {
  candidateApplicationStatusLabels,
  type ApplicationScreeningStatus
} from "@/lib/jobs/types";

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

export default async function ApplicantReviewPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const { id } = await params;
  const session = await requirePageSession(`/people/candidates/applicants/${id}`);
  const pageState = await searchParams;
  const detail = await getApplicantReviewDetail(id);

  if (!detail) {
    notFound();
  }

  if (!session.permissions.includes("view_candidates")) {
    redirect("/people/candidates/applicants");
  }

  const canViewApplication = await canUsePermissionForDepartment(session, "view_candidates", detail.candidate.departmentId);
  if (!canViewApplication) {
    redirect("/people/candidates/applicants");
  }

  const previewUrl = detail.latestResume
    ? `/api/candidates/${detail.candidate.id}/resume/file?storageKey=${encodeURIComponent(detail.latestResume.storageKey)}`
    : null;
  const downloadUrl = detail.latestResume
    ? `/api/candidates/${detail.candidate.id}/resume/file?storageKey=${encodeURIComponent(detail.latestResume.storageKey)}&download=1`
    : null;
  const returnTo = `/people/candidates/applicants/${detail.id}` as Route;
  const canManageApplications = await canUsePermissionForDepartment(session, "manage_candidates", detail.candidate.departmentId);
  const canMoveToPipeline = await canUsePermissionForDepartment(session, "promote_candidate", detail.candidate.departmentId) || await canUsePermissionForDepartment(session, "manage_candidates", detail.candidate.departmentId);

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Hiring"
      title={detail.candidate.fullName}
      subtitle={`Application for ${detail.job.title}`}
      utility={
        <div className="flex flex-wrap items-center gap-2">
          <PeopleViewSwitch current="candidates" />
          <Link href="/people/candidates/applicants">
            <Button variant="secondary">Back to applicants</Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <CandidatesViewSwitch current="applicants" />

        {pageState.updated ? <NoticeBanner tone="success">Review updated.</NoticeBanner> : null}
        {pageState.error ? <NoticeBanner tone="error">{pageState.error}</NoticeBanner> : null}

        <StagePanel className="space-y-5 overflow-hidden bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_16%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-brand)]">Applicant review</p>
              <h2 className="text-2xl text-[color:var(--app-heading)]">Review this application</h2>
              <p className="max-w-2xl text-sm text-[color:var(--app-text)]">
                Review the application, resume, and job context before deciding whether this person should enter the candidate pipeline.
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

          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
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
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Owner</p>
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
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Decision actions</p>
                <h3 className="text-xl text-[color:var(--app-heading)]">Decide the next step</h3>
                <p className="text-sm text-[color:var(--app-muted)]">Set an owner, then keep the application under review, move it into the pipeline, or close it.</p>
              </div>

              {canManageApplications ? (
                <form action={`/api/candidate-applications/${detail.id}`} method="post" className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                  <input type="hidden" name="action" value="review" />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <FormInput
                    name="hrOwner"
                    label="Owner"
                    defaultValue={detail.candidate.hrOwner || ""}
                    placeholder="Assign an owner"
                  />
                  <Button type="submit" variant="secondary">Keep under review</Button>
                </form>
              ) : null}

              {canMoveToPipeline ? (
                <form action={`/api/candidate-applications/${detail.id}`} method="post" className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                  <input type="hidden" name="action" value="promote" />
                  <input type="hidden" name="returnTo" value={`/candidates/${detail.candidate.id}` as Route} />
                  <FormInput
                    name="hrOwner"
                    label="Owner"
                    defaultValue={detail.candidate.hrOwner || ""}
                    placeholder="Assign an owner"
                  />
                  <Button type="submit">Move to candidate pipeline</Button>
                </form>
              ) : null}

              {canManageApplications ? (
                <form action={`/api/candidate-applications/${detail.id}`} method="post" className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                  <input type="hidden" name="action" value="close" />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <Button type="submit" variant="secondary">Close application</Button>
                </form>
              ) : null}

              {!canManageApplications && !canMoveToPipeline ? (
                <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 text-sm text-[color:var(--app-muted)]">
                  You can view this application, but your role cannot change its review state.
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Link href={`/candidates/${detail.candidate.id}` as Route}>
                  <Button type="button" variant="ghost">Open candidate profile</Button>
                </Link>
              </div>
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
                        {!addon.inlineSupported ? " | Inline completion unavailable" : ""}
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
          </div>
        </div>
      </div>
    </SceneShell>
  );
}
