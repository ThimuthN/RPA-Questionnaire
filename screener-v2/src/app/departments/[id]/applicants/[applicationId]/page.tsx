import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { CandidateSidebar } from "@/components/candidates/CandidateSidebar";
import { ResumePreviewModal } from "@/components/candidates/ResumePreviewModal";
import { ResponsibleTeamCard } from "@/components/candidates/ResponsibleTeamCard";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { requirePageSession } from "@/lib/auth/guards";
import { canUsePermissionForDepartment } from "@/lib/auth/permission-evaluator";
import { getCandidateDetail } from "@/lib/db/candidates";
import { getDepartment } from "@/lib/db/departments";
import { listDepartmentHiringTeamOptions } from "@/lib/db/hiring-team-templates";
import { getApplicationAssignments } from "@/lib/db/hiring-assignments";
import { getApplicantReviewDetail } from "@/lib/db/jobs";
import { candidateApplicationStatusLabels, type ApplicationScreeningStatus } from "@/lib/jobs/types";
import { cn } from "@/lib/utils";

const applicantTabs = [
  { key: "application", label: "Application" },
  { key: "screening", label: "Screening" },
  { key: "files", label: "Files" },
] as const;
type ApplicantTab = (typeof applicantTabs)[number]["key"];

function parseApplicantTab(value?: string | null): ApplicantTab {
  return applicantTabs.some((t) => t.key === value) ? (value as ApplicantTab) : "application";
}

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

function formatPercent(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function ApplicantTabs({
  departmentId,
  applicationId,
  currentTab,
}: {
  departmentId: string;
  applicationId: string;
  currentTab: ApplicantTab;
}) {
  function tabHref(key: ApplicantTab): Route {
    const params = new URLSearchParams();
    if (key !== "application") params.set("tab", key);
    const q = params.toString();
    return `/departments/${departmentId}/applicants/${applicationId}${q ? `?${q}` : ""}` as Route;
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] p-1 shadow-[var(--app-shadow-soft)]">
      {applicantTabs.map((tab) => (
        <Link
          key={tab.key}
          href={tabHref(tab.key)}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80",
            currentTab === tab.key
              ? "bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--app-brand)_22%,transparent)]"
              : "text-[color:var(--app-muted)] hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)]"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export default async function DepartmentApplicantReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; applicationId: string }>;
  searchParams: Promise<{ updated?: string; error?: string; tab?: string }>;
}) {
  const { id: departmentId, applicationId } = await params;
  const pageState = await searchParams;
  const currentTab = parseApplicantTab(pageState.tab);

  const session = await requirePageSession(
    `/departments/${departmentId}/applicants/${applicationId}`
  );

  const [department, detail] = await Promise.all([
    getDepartment(departmentId),
    getApplicantReviewDetail(applicationId),
  ]);

  if (!department || !detail) notFound();

  const belongsToDept =
    detail.candidate.departmentId === departmentId || detail.job.departmentId === departmentId;
  if (!belongsToDept) notFound();

  const canViewApplication = await canUsePermissionForDepartment(
    session,
    "view_candidates",
    departmentId
  );
  if (!canViewApplication) redirect(`/departments/${departmentId}/applicants`);

  const [candidate, assignments, teamOptions, canManageApplications, canPromotePermission] =
    await Promise.all([
      getCandidateDetail(detail.candidate.id),
      getApplicationAssignments(detail.id),
      listDepartmentHiringTeamOptions(departmentId),
      canUsePermissionForDepartment(session, "manage_candidates", departmentId),
      canUsePermissionForDepartment(session, "promote_candidate", departmentId),
    ]);

  if (!candidate) notFound();

  const canMoveToPipeline = canManageApplications || canPromotePermission;
  const reviewHref = `/departments/${departmentId}/applicants/${detail.id}` as Route;
  const backHref = `/departments/${departmentId}/applicants` as Route;

  const previewUrl = detail.latestResume
    ? `/api/candidates/${detail.candidate.id}/resume/file?storageKey=${encodeURIComponent(detail.latestResume.storageKey)}`
    : null;
  const downloadUrl = detail.latestResume
    ? `/api/candidates/${detail.candidate.id}/resume/file?storageKey=${encodeURIComponent(detail.latestResume.storageKey)}&download=1`
    : null;

  const activeApplication =
    candidate.applications.find((a) => a.id === applicationId) ??
    candidate.applications[0] ??
    null;
  const teamNames = assignments.map((a) => a.user.name ?? a.user.email);
  const hasAssignedPanel = assignments.length > 0;

  const candidateProfileHref =
    `/people/candidates/${detail.candidate.id}?workspaceId=${departmentId}&returnTo=${encodeURIComponent(reviewHref)}` as Route;

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow={department.name}
      title={detail.candidate.fullName}
      subtitle={`Applied for ${detail.job.title}`}
      utility={
        <Link href={backHref}>
          <Button variant="secondary">Back to applicants</Button>
        </Link>
      }
    >
      {pageState.updated ? (
        <div className="mb-4 rounded-[16px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Application updated.
        </div>
      ) : null}
      {pageState.error ? (
        <div className="mb-4 rounded-[16px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {pageState.error}
        </div>
      ) : null}

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        {/* Sidebar */}
        <div className="w-full xl:w-[300px] xl:flex-shrink-0 xl:sticky xl:top-4">
          <CandidateSidebar
            candidate={candidate}
            currentDetailPath={reviewHref}
            backHref={backHref}
            departmentName={department.name}
            resumeDownloadUrl={downloadUrl}
            resumeFileName={detail.latestResume?.fileName}
            canManage={canManageApplications}
            canDelete={false}
            canPromote={canMoveToPipeline}
            activeApplication={activeApplication}
            teamCount={assignments.length}
            teamNames={teamNames}
          />
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-4">
          <ApplicantTabs
            departmentId={departmentId}
            applicationId={detail.id}
            currentTab={currentTab}
          />

          {/* Application tab */}
          {currentTab === "application" ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              {/* Left: details + cover note */}
              <StagePanel tone="flat" className="space-y-4">
                <div className="space-y-0.5">
                  <h2 className="text-base font-semibold text-[color:var(--app-heading)]">
                    Application details
                  </h2>
                  <p className="text-xs text-[color:var(--app-muted)]">
                    Submitted {new Date(detail.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoCell label="Email" value={detail.candidate.email} />
                  <InfoCell label="Phone" value={detail.candidate.phone || "—"} />
                  <InfoCell label="Applied for" value={detail.job.title} />
                  {detail.job.roleLabel ? (
                    <InfoCell label="Role" value={detail.job.roleLabel} />
                  ) : null}
                  <InfoCell
                    label="Panel owner"
                    value={detail.candidate.hrOwner || "Unassigned"}
                  />
                  <InfoCell
                    label="Resume"
                    value={detail.latestResume ? "Attached" : "Not uploaded"}
                  />
                </div>

                <div className="space-y-1.5 border-t border-[color:var(--app-border)] pt-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
                    Cover note
                  </p>
                  <p className="text-sm leading-6 text-[color:var(--app-text)]">
                    {detail.applicationNote || "No cover note submitted."}
                  </p>
                </div>
              </StagePanel>

              {/* Right: hiring panel + decision */}
              <div className="space-y-4">
                <ResponsibleTeamCard
                  mode="application"
                  entityId={detail.id}
                  assignments={assignments.map((a) => ({
                    id: a.id,
                    user: a.user,
                    assignmentRole: a.assignmentRole,
                    isPrimary: a.isPrimary,
                  }))}
                  users={teamOptions.users}
                  templates={teamOptions.templates}
                  canEdit={canManageApplications}
                />

                <StagePanel tone="flat" className="space-y-3">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-semibold text-[color:var(--app-heading)]">
                      Decision
                    </h2>
                    <p className="text-xs text-[color:var(--app-muted)]">
                      Advance, hold, or archive this application.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canMoveToPipeline ? (
                      <form action={`/api/candidate-applications/${detail.id}`} method="post">
                        <input type="hidden" name="action" value="promote" />
                        <input type="hidden" name="returnTo" value={reviewHref} />
                        <Button type="submit" disabled={!hasAssignedPanel}>
                          Move to pipeline
                        </Button>
                      </form>
                    ) : null}
                    {canManageApplications ? (
                      <form action={`/api/candidate-applications/${detail.id}`} method="post">
                        <input type="hidden" name="action" value="review" />
                        <input type="hidden" name="returnTo" value={reviewHref} />
                        <Button type="submit" variant="secondary">
                          Keep under review
                        </Button>
                      </form>
                    ) : null}
                    {canManageApplications ? (
                      <form action={`/api/candidate-applications/${detail.id}`} method="post">
                        <input type="hidden" name="action" value="close" />
                        <input type="hidden" name="returnTo" value={reviewHref} />
                        <Button type="submit" variant="secondary">
                          Archive
                        </Button>
                      </form>
                    ) : null}
                  </div>

                  {!hasAssignedPanel && canMoveToPipeline ? (
                    <p className="text-xs text-amber-400">
                      Assign a hiring panel before advancing to the pipeline.
                    </p>
                  ) : null}
                  {!canManageApplications && !canMoveToPipeline ? (
                    <p className="text-xs text-[color:var(--app-muted)]">
                      Your role cannot change this application&apos;s status.
                    </p>
                  ) : null}
                </StagePanel>

                <Link href={candidateProfileHref}>
                  <Button variant="ghost" className="w-full text-xs">
                    Open full candidate profile →
                  </Button>
                </Link>
              </div>
            </div>
          ) : null}

          {/* Screening tab */}
          {currentTab === "screening" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h2 className="text-xl font-semibold text-[color:var(--app-heading)]">
                    Screening results
                  </h2>
                  <p className="text-sm text-[color:var(--app-muted)]">
                    Responses and scores from the application screener.
                  </p>
                </div>
                {detail.screeningAddonResults.length > 0 ? (
                  <div className="flex flex-shrink-0 flex-wrap gap-2">
                    {detail.job.screenerPresetLabel ? (
                      <StatusPill label={detail.job.screenerPresetLabel} tone="blue" />
                    ) : null}
                    <StatusPill
                      label={screeningResultLabel(detail.screeningStatus)}
                      tone={screeningResultTone(detail.screeningStatus)}
                    />
                  </div>
                ) : null}
              </div>

              {detail.screeningAddonResults.length === 0 ? (
                <StagePanel tone="flat">
                  <p className="text-sm text-[color:var(--app-muted)]">
                    No screening responses were submitted with this application.
                  </p>
                </StagePanel>
              ) : (
                <div className="space-y-4">
                  {detail.screeningAddonResults.map((addon, index) => (
                    <StagePanel
                      key={`${addon.addonLabel}:${index}`}
                      tone="flat"
                      className="space-y-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-0.5">
                          <h3 className="text-base font-semibold text-[color:var(--app-heading)]">
                            {addon.addonLabel}
                          </h3>
                          <p className="text-xs text-[color:var(--app-muted)]">
                            {addon.isMandatory ? "Required" : "Optional"}
                            {addon.weight > 0 ? ` · Weight ${addon.weight}` : ""}
                            {!addon.inlineSupported ? " · Needs manual review" : ""}
                          </p>
                        </div>
                        <StatusPill
                          label={screeningResultLabel(addon.status)}
                          tone={screeningResultTone(addon.status)}
                        />
                      </div>

                      <div className="grid gap-3 border-t border-[color:var(--app-border)] pt-3 sm:grid-cols-4">
                        <ScoreCell label="Required" value={formatPercent(addon.requiredPercent)} />
                        <ScoreCell
                          label="Score"
                          value={formatPercent(addon.applicantPercent)}
                        />
                        <ScoreCell
                          label="Points"
                          value={`${addon.pointsEarned} / ${addon.pointsPossible}`}
                        />
                        <ScoreCell label="Result" value={screeningResultLabel(addon.status)} />
                      </div>

                      {addon.responses.length > 0 ? (
                        <div className="space-y-3 border-t border-[color:var(--app-border)] pt-4">
                          {addon.responses.map((response) => (
                            <div
                              key={`${addon.addonLabel}:${response.questionKey}`}
                              className="rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-0.5">
                                  <p className="text-sm font-medium text-[color:var(--app-heading)]">
                                    {response.questionLabel}
                                  </p>
                                  <p className="text-xs text-[color:var(--app-muted)]">
                                    {response.formatLabel}
                                  </p>
                                </div>
                                <p className="flex-shrink-0 text-xs text-[color:var(--app-muted)]">
                                  {response.pointsEarned} / {response.pointsPossible}
                                </p>
                              </div>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--app-text)]">
                                {response.answerText || "No answer submitted."}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </StagePanel>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Files tab */}
          {currentTab === "files" ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-[color:var(--app-heading)]">Resume</h2>
              <StagePanel tone="flat" className="space-y-4">
                {detail.latestResume ? (
                  <>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-[color:var(--app-heading)]">
                        {detail.latestResume.fileName}
                      </p>
                      <p className="text-xs text-[color:var(--app-muted)]">
                        {Math.max(1, Math.round(detail.latestResume.sizeBytes / 1024))} KB ·
                        Uploaded {new Date(detail.latestResume.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
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
                  <p className="text-sm text-[color:var(--app-muted)]">
                    No resume uploaded with this application.
                  </p>
                )}
              </StagePanel>
            </div>
          ) : null}
        </div>
      </div>
    </SceneShell>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
        {label}
      </p>
      <p className="text-sm text-[color:var(--app-text)]">{value}</p>
    </div>
  );
}

function ScoreCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
        {label}
      </p>
      <p className="text-sm text-[color:var(--app-text)]">{value}</p>
    </div>
  );
}
