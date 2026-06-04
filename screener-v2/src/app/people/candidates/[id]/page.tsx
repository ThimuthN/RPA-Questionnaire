import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { CandidateActivityModal } from "@/components/candidates/CandidateActivityModal";
import { CandidateMilestoneTimeline } from "@/components/candidates/CandidateMilestoneTimeline";
import { CandidateNotesModal } from "@/components/candidates/CandidateNotesModal";
import { DefaultJourneySkeleton } from "@/components/candidates/DefaultJourneySkeleton";
import { EditCandidateInfoModal } from "@/components/candidates/EditCandidateInfoModal";
import { FinalizeActionBar } from "@/components/candidates/FinalizeActionBar";
import { ResumePreviewModal } from "@/components/candidates/ResumePreviewModal";
import { ResumeUploader } from "@/components/candidates/ResumeUploader";
import { TransferCandidateAction } from "@/components/candidates/TransferCandidateAction";
import { ResponsibleTeamCard } from "@/components/candidates/ResponsibleTeamCard";
import { Button } from "@/components/primitives/Button";
import { ConfirmSubmitButton } from "@/components/primitives/ConfirmSubmitButton";
import { StatusPill } from "@/components/primitives/StatusPill";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { getCandidateStageLabel } from "@/lib/candidates/lifecycle";
import type { CandidateStage } from "@/lib/candidates/types";
import { buildCandidateActivityFeed } from "@/lib/candidates/workspace";
import { requirePageSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { getCandidateDetail } from "@/lib/db/candidates";
import { getDepartment } from "@/lib/db/departments";
import { candidateApplicationStatusLabels, isActiveApplicationStatus } from "@/lib/jobs/types";
import { prisma } from "@/lib/db/prisma";
import { getApplicationAssignments } from "@/lib/db/hiring-assignments";

export const dynamic = "force-dynamic";

type CandidateData = NonNullable<Awaited<ReturnType<typeof getCandidateDetail>>>;

function latestAssessment(candidate: CandidateData) {
  return candidate.assessments[0] ?? null;
}

function nextPrompt(candidate: CandidateData) {
  if (candidate.stage === "applicant") {
    return "Review the application and move them into the pipeline when you're ready.";
  }
  if (!candidate.resumes.length) return "Add a resume if you need one for review.";
  if (candidate.currentFocus) return candidate.currentFocus;
  return "Set the next stage when you're ready.";
}

function primaryApplication(candidate: CandidateData) {
  return candidate.applications.find((application) => isActiveApplicationStatus(application.status)) ?? candidate.applications[0] ?? null;
}

function applicationTone(status: string): "neutral" | "blue" | "amber" | "emerald" {
  if (status === "under_review") return "amber";
  if (status === "moved_to_pipeline") return "emerald";
  if (status === "closed") return "blue";
  return "neutral";
}

function latestAssessmentSummary(candidate: CandidateData) {
  const latest = latestAssessment(candidate);
  if (!latest) {
    return {
      title: "No assessment yet",
      detail: "No exam linked."
    };
  }

  if (typeof latest.finalPercent === "number") {
    return {
      title: `${latest.finalPercent.toFixed(1)} / 100`,
      detail: latest.submittedAt ? `Completed ${compactDate(latest.submittedAt)}` : "Assessment completed"
    };
  }

  if (latest.submittedAt) {
    return {
      title: "Submitted",
      detail: `Completed ${compactDate(latest.submittedAt)}`
    };
  }

  if (latest.startedAt) {
    return {
      title: "In progress",
      detail: `Started ${compactDate(latest.startedAt)}`
    };
  }

  return {
    title: "Assigned",
    detail: "Assessment assigned"
  };
}

function compactDate(value?: string | Date | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString();
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
      ? "rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"
      : "rounded-[20px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100";

  return <div className={className}>{children}</div>;
}

function SummaryCard({
  label,
  title,
  detail,
  tone = "default"
}: {
  label: string;
  title: React.ReactNode;
  detail: React.ReactNode;
  tone?: "default" | "accent" | "warning";
}) {
  const toneClassName =
    tone === "accent"
      ? "border-[color:var(--app-brand)]/20 bg-[color:var(--app-brand)]/10"
      : tone === "warning"
        ? "border-amber-400/30 bg-amber-500/10"
        : "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)]";

  return (
    <div className={`rounded-[18px] border p-4 ${toneClassName}`}>
      <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">{label}</p>
      <p className="mt-2 text-lg text-[color:var(--app-heading)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--app-muted)]">{detail}</p>
    </div>
  );
}

function safeLocalPath(value?: string | null) {
  if (!value || !value.startsWith("/")) {
    return undefined;
  }
  return value;
}

function fallbackWorkspaceDepartmentId(candidate: CandidateData) {
  return (
    candidate.departmentCandidacies?.find((candidacy) => candidacy.status === "active")?.departmentId ??
    candidate.departmentId
  );
}

async function resolveWorkspaceContext({
  candidate,
  workspaceId,
  returnTo
}: {
  candidate: CandidateData;
  workspaceId?: string;
  returnTo?: string;
}) {
  const requestedDepartmentId = workspaceId?.trim() || fallbackWorkspaceDepartmentId(candidate);
  if (requestedDepartmentId) {
    const department = await getDepartment(requestedDepartmentId);
    if (department) {
      const candidateListHref = `/departments/${department.id}/candidates` as Route;
      return {
        kind: "department" as const,
        label: department.name,
        workspaceHref: `/departments/${department.id}` as Route,
        candidateListHref,
        backHref: (returnTo ?? candidateListHref) as Route
      };
    }
  }

  const defaultCandidatesHref =
    (candidate.stage === "applicant" ? "/people/candidates/applicants" : "/people/candidates") as Route;
  return {
    kind: "admin" as const,
    label: "Admin Workspace",
    workspaceHref: undefined,
    candidateListHref: defaultCandidatesHref,
    backHref: (returnTo ?? defaultCandidatesHref) as Route
  };
}

function buildDetailPath(candidateId: string, workspaceId?: string, returnTo?: string) {
  const params = new URLSearchParams();
  if (workspaceId) {
    params.set("workspaceId", workspaceId);
  }
  if (returnTo) {
    params.set("returnTo", returnTo);
  }
  const query = params.toString();
  return `/people/candidates/${candidateId}${query ? `?${query}` : ""}`;
}

export default async function CandidateDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string;
    updated?: string;
    noteAdded?: string;
    resumeUploaded?: string;
    error?: string;
    workspaceId?: string;
    returnTo?: string;
    fromDepartment?: string;
  }>;
}) {
  const { id } = await params;
  const pageState = await searchParams;
  const requestedWorkspaceId = pageState.workspaceId?.trim() || pageState.fromDepartment?.trim() || undefined;
  const returnTo = safeLocalPath(pageState.returnTo?.trim());
  const requestPath = buildDetailPath(id, requestedWorkspaceId, returnTo);
  const session = await requirePageSession(requestPath);
  const permission = await requireCandidatePermission(session, id, "view_candidates");
  if (!permission.ok) {
    if (permission.response.status === 404) {
      notFound();
    }
    redirect("/people/candidates");
  }

  const candidate = await getCandidateDetail(id);
  if (!candidate) {
    notFound();
  }

  const activeApplication = primaryApplication(candidate);
  const currentResume = candidate.resumes[0] ?? null;
  const latestAssessmentState = latestAssessmentSummary(candidate);
  const resumePreviewUrl = currentResume
    ? `/api/candidates/${candidate.id}/resume/file?storageKey=${encodeURIComponent(currentResume.storageKey)}`
    : null;
  const resumeDownloadUrl = currentResume
    ? `/api/candidates/${candidate.id}/resume/file?storageKey=${encodeURIComponent(currentResume.storageKey)}&download=1`
    : null;
  const activityFeed = buildCandidateActivityFeed(candidate);
  const workspaceContext = await resolveWorkspaceContext({
    candidate,
    workspaceId: requestedWorkspaceId,
    returnTo
  });
  const currentDetailPath = buildDetailPath(candidate.id, requestedWorkspaceId, returnTo);

  // Fetch assignments and users for the active application (or first if none active)
  const targetApplication = activeApplication || candidate.applications[0] || null;

  // Load workspace context and team assignments
  const [assignments, users, departmentCandidacy] = await Promise.all([
    targetApplication ? getApplicationAssignments(targetApplication.id) : Promise.resolve([]),
    (async () => {
      if (targetApplication) {
        // Load workspace team users via AccessGrant if job has a department
        const jobPosting = await prisma.jobPosting.findUnique({
          where: { id: targetApplication.jobPostingId },
          select: { departmentId: true }
        });

        if (jobPosting?.departmentId) {
          // Department workspace: load team members from AccessGrant
          const grants = await prisma.accessGrant.findMany({
            where: {
              departmentId: jobPosting.departmentId,
              scope: "department",
              status: "active"
            },
            select: {
              user: { select: { id: true, name: true, email: true } }
            },
            orderBy: { user: { name: "asc" } }
          });
          return grants.map(g => g.user);
        } else {
          // Admin workspace: load all active users
          return prisma.user.findMany({
            where: { isActive: true },
            select: { id: true, name: true, email: true },
            orderBy: { name: "asc" }
          });
        }
      } else {
        // No application - try to get users from department candidacy
        const candidacy = await prisma.departmentCandidacy.findFirst({
          where: { candidateId: candidate.id, status: "active" },
          select: { departmentId: true }
        });

        if (candidacy?.departmentId) {
          const grants = await prisma.accessGrant.findMany({
            where: {
              departmentId: candidacy.departmentId,
              scope: "department",
              status: "active"
            },
            select: {
              user: { select: { id: true, name: true, email: true } }
            },
            orderBy: { user: { name: "asc" } }
          });
          return grants.map(g => g.user);
        }

        return [];
      }
    })(),
    (async () => {
      // Load DepartmentCandidacy with team assignments
      const activeCandidacy = await prisma.departmentCandidacy.findFirst({
        where: { candidateId: candidate.id, status: "active" },
        include: {
          teamAssignments: {
            where: { isActive: true },
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });
      return activeCandidacy;
    })()
  ]);
  const hasResponsibleAssignments = assignments.length > 0;
  const hasCandidacyTeamAssignments = departmentCandidacy?.teamAssignments.length ?? 0 > 0;
  const shouldWarnNoLinkedApplication = candidate.applications.length === 0;
  const shouldWarnResponsibleTeam = !hasResponsibleAssignments && !hasCandidacyTeamAssignments;
  const latestAssessmentRecord = latestAssessment(candidate);
  const assessmentAction = latestAssessmentRecord?.attemptId
    ? {
        href: `/results/${latestAssessmentRecord.attemptId}` as Route,
        label: "Open evidence"
      }
    : session.permissions.includes("manage_candidates") && candidate.stage !== "applicant"
      ? {
          href: `/create-test?candidateId=${candidate.id}` as Route,
          label: "Assign assessment"
        }
      : null;
  const outcomeBadges = (
    <div className="flex flex-wrap gap-2">
      {candidate.currentFocus ? <StatusPill label={candidate.currentFocus} tone="neutral" /> : null}
      {candidate.hrOwner ? (
        <StatusPill label={`Owner ${candidate.hrOwner}`} tone="neutral" className="normal-case tracking-normal" />
      ) : null}
      <StatusPill
        label={getCandidateStageLabel(candidate.stage as CandidateStage)}
        tone={candidate.stage === "applicant" ? "amber" : "blue"}
      />
      <StatusPill label={currentResume ? "Resume attached" : "Resume missing"} tone={currentResume ? "emerald" : "amber"} />
      {activeApplication ? (
        <StatusPill
          label={candidateApplicationStatusLabels[activeApplication.status]}
          tone={applicationTone(activeApplication.status)}
        />
      ) : null}
      <StatusPill
        label={
          hasResponsibleAssignments || departmentCandidacy?.teamAssignments.length
            ? `Team assigned`
            : "Responsible team required"
        }
        tone={hasResponsibleAssignments || departmentCandidacy?.teamAssignments.length ? "emerald" : "amber"}
      />
    </div>
  );

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow={workspaceContext.kind === "department" ? "Department workspace" : "Admin workspace"}
      title={
        <>
          <span className="mb-3 block text-sm font-medium text-[color:var(--app-muted)]">
            <span>Workspaces</span>
            <span className="mx-2 text-[color:var(--app-border-strong)]">/</span>
            {workspaceContext.workspaceHref ? (
              <Link href={workspaceContext.workspaceHref}>{workspaceContext.label}</Link>
            ) : (
              <span>{workspaceContext.label}</span>
            )}
            <span className="mx-2 text-[color:var(--app-border-strong)]">/</span>
            <Link href={workspaceContext.candidateListHref}>Candidates</Link>
          </span>
          <span>{candidate.fullName}</span>
        </>
      }
      subtitle={candidate.roleLabel ? `${candidate.roleLabel} | ${candidate.email}` : candidate.email}
      utility={
        <Link href={workspaceContext.backHref}>
          <Button variant="secondary">
            {workspaceContext.kind === "department" ? `Back to ${workspaceContext.label} candidates` : "Back to candidates"}
          </Button>
        </Link>
      }
    >
      <div className="space-y-5">
        {pageState.created || pageState.updated || pageState.noteAdded || pageState.resumeUploaded || pageState.error ? (
          <div className="space-y-2">
            {pageState.created || pageState.updated ? <NoticeBanner tone="success">Candidate saved.</NoticeBanner> : null}
            {pageState.noteAdded ? <NoticeBanner tone="success">Note added.</NoticeBanner> : null}
            {pageState.resumeUploaded ? <NoticeBanner tone="success">Resume uploaded.</NoticeBanner> : null}
            {pageState.error ? <NoticeBanner tone="error">{pageState.error}</NoticeBanner> : null}
          </div>
        ) : null}

        <StagePanel className="space-y-6 overflow-hidden bg-[linear-gradient(135deg,color-mix(in_srgb,var(--app-brand)_16%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--app-brand)]">Candidate lifecycle</p>
              <h2 className="text-3xl text-[color:var(--app-heading)]">Current decision</h2>
              <p className="max-w-2xl text-sm text-[color:var(--app-text)]">
                Keep the candidate, team ownership, evidence, and next move visible in one review cockpit.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {candidate.stage === "applicant" && activeApplication && session.permissions.includes("promote_candidate") ? (
                <form action={`/api/candidate-applications/${activeApplication.id}`} method="post">
                  <input type="hidden" name="action" value="promote" />
                  <input type="hidden" name="returnTo" value={currentDetailPath} />
                  <Button type="submit">Move to pipeline</Button>
                </form>
              ) : null}
              {session.permissions.includes("manage_candidates") ? <EditCandidateInfoModal candidate={candidate} /> : null}
              {session.permissions.includes("manage_candidates") && candidate.orgStage !== "finalized" ? (
                <TransferCandidateAction candidateId={candidate.id} />
              ) : null}
              {session.permissions.includes("delete_candidate") ? (
                <form action={`/api/candidates/${candidate.id}/delete`} method="post">
                  <input type="hidden" name="returnTo" value={workspaceContext.backHref} />
                  <ConfirmSubmitButton
                    variant="secondary"
                    confirmMessage={`Delete ${candidate.fullName}? This removes the candidate and any linked lifecycle data. This is a data cleanup action and cannot be undone.`}
                  >
                    Delete record
                  </ConfirmSubmitButton>
                </form>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="space-y-5">
              {outcomeBadges}

              {(shouldWarnResponsibleTeam || shouldWarnNoLinkedApplication) ? (
                <div className="rounded-[20px] border border-amber-400/30 bg-amber-500/10 p-5">
                  <p className="text-sm font-medium text-amber-100 mb-3">Setup required</p>
                  <ul className="space-y-2 text-sm text-amber-100/90">
                    {shouldWarnNoLinkedApplication ? (
                      <li className="flex items-start gap-2">
                        <span className="text-amber-300 mt-0.5">•</span>
                        <span>Linked application</span>
                      </li>
                    ) : null}
                    {shouldWarnResponsibleTeam ? (
                      <li className="flex items-start gap-2">
                        <span className="text-amber-300 mt-0.5">•</span>
                        <span>Responsible team</span>
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <SummaryCard
                  label="Current stage"
                  title={getCandidateStageLabel(candidate.stage as CandidateStage)}
                  detail={candidate.currentFocus || (candidate.stage === "applicant" ? "In applicant review" : "Awaiting next action")}
                  tone="accent"
                />
                <SummaryCard
                  label="Responsible team"
                  title={
                    hasResponsibleAssignments
                      ? `${assignments.length} assigned`
                      : departmentCandidacy?.teamAssignments.length
                        ? `${departmentCandidacy.teamAssignments.length} assigned`
                        : "No owner"
                  }
                  detail={
                    hasResponsibleAssignments || departmentCandidacy?.teamAssignments.length
                      ? `Team is assigned to this candidate.`
                      : "No owner or hiring team is assigned yet."
                  }
                  tone="default"
                />
                <SummaryCard
                  label="Linked application"
                  title={activeApplication ? activeApplication.jobTitle : "Not linked"}
                  detail={
                    activeApplication
                      ? `${activeApplication.roleLabel || "No role linked"} | ${activeApplication.roleDepartment || workspaceContext.label}`
                      : "Not yet connected to a hiring journey."
                  }
                  tone="default"
                />
                <SummaryCard
                  label="Assessment evidence"
                  title={latestAssessmentState.title}
                  detail={latestAssessmentState.detail}
                  tone="default"
                />
                <SummaryCard
                  label="Resume"
                  title={currentResume ? "Attached" : "None yet"}
                  detail={currentResume ? currentResume.fileName : "Upload a resume to add review context."}
                  tone="default"
                />
                <SummaryCard label="Next step" title={nextPrompt(candidate)} detail={candidate.email} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)]/85 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Decision cockpit</p>
                <h3 className="mt-2 text-2xl text-[color:var(--app-heading)]">Set the candidate decision</h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--app-muted)]">
                  Finalize only when the workflow evidence, owner, and workspace context are clear.
                </p>
              </div>

              <FinalizeActionBar
                candidateId={candidate.id}
                orgStage={candidate.orgStage}
                finalizedAs={candidate.finalizedAs}
                permissions={session.permissions}
              />

              <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)]/85 p-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Assessment evidence</p>
                  <p className="text-lg text-[color:var(--app-heading)]">{latestAssessmentState.title}</p>
                  <p className="text-sm leading-6 text-[color:var(--app-muted)]">{latestAssessmentState.detail}</p>
                </div>
                {assessmentAction ? (
                  <div className="mt-4">
                    <Link href={assessmentAction.href}>
                      <Button type="button" variant={latestAssessmentRecord?.attemptId ? "secondary" : "primary"}>
                        {assessmentAction.label}
                      </Button>
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </StagePanel>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-2xl text-[color:var(--app-heading)]">Candidate journey</h2>
                <p className="text-sm text-[color:var(--app-muted)]">
                  Follow the review path from intake through the final decision.
                </p>
              </div>
              {candidate.milestones.length === 0 ? (
                <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6">
                  <DefaultJourneySkeleton
                    hasLinkedApplication={candidate.applications.length > 0}
                  />
                </div>
              ) : (
                <CandidateMilestoneTimeline
                  candidateId={candidate.id}
                  milestones={candidate.milestones}
                  hasResume={Boolean(currentResume)}
                />
              )}
            </div>
          </div>

          <div className="space-y-6">
            {targetApplication || departmentCandidacy?.teamAssignments.length ? (
              <ResponsibleTeamCard
                applicationId={targetApplication?.id || departmentCandidacy?.id || ""}
                assignments={
                  targetApplication
                    ? assignments
                    : departmentCandidacy?.teamAssignments.map((ta) => ({
                        id: ta.id,
                        user: ta.user,
                        assignmentRole: ta.role,
                        isPrimary: ta.isPrimary,
                        role: ta.role,
                        source: ta.source as "template" | "manual" | "job_default"
                      })) || []
                }
                users={users}
                canEdit={session.permissions.includes("manage_candidates")}
              />
            ) : (
              <section className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl text-[color:var(--app-heading)]">Responsible team</h2>
                  <p className="text-sm text-[color:var(--app-muted)]">Hiring team members assigned to this candidate.</p>
                </div>
                <div className="rounded-[20px] border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                  <p className="font-medium">Responsible team required</p>
                  <p className="mt-1 text-xs leading-5 opacity-90">
                    {candidate.applications.length === 0
                      ? "Create or link an application first so a responsible team can own this candidate."
                      : "Assign an owner or hiring team before advancing this candidate."}
                  </p>
                </div>
              </section>
            )}

            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl text-[color:var(--app-heading)]">Applications</h2>
                <p className="text-sm text-[color:var(--app-muted)]">Keep the linked job and workspace history visible here.</p>
              </div>

              <div className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                {candidate.applications.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">No linked application</p>
                    <p className="text-sm leading-6 text-[color:var(--app-muted)]">
                      This candidate is not yet connected to a job/workspace hiring journey. Link or create an application before advancing.
                    </p>
                  </div>
                ) : (
                  candidate.applications.map((application) => (
                    <div
                      key={application.id}
                      className="space-y-2 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill
                          label={candidateApplicationStatusLabels[application.status]}
                          tone={applicationTone(application.status)}
                        />
                        <StatusPill
                          label={new Date(application.createdAt).toLocaleDateString()}
                          tone="neutral"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-[color:var(--app-heading)]">{application.jobTitle}</p>
                        <p className="text-xs text-[color:var(--app-muted)]">
                          {application.roleLabel || "No role linked"}
                          {application.roleDepartment ? ` | ${application.roleDepartment}` : ""}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section id="resume" className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl text-[color:var(--app-heading)]">Resume</h2>
                <p className="text-sm text-[color:var(--app-muted)]">Keep the latest resume here.</p>
              </div>

              <div className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                {currentResume ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label="Current" tone="blue" />
                      <StatusPill label="PDF" tone="neutral" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-[color:var(--app-heading)]">{currentResume.fileName}</p>
                      <p className="text-xs text-[color:var(--app-muted)]">
                        {Math.max(1, Math.round(currentResume.sizeBytes / 1024))} KB | Uploaded{" "}
                        {new Date(currentResume.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resumePreviewUrl ? (
                        <ResumePreviewModal
                          fileName={currentResume.fileName}
                          previewUrl={resumePreviewUrl}
                          downloadUrl={resumeDownloadUrl}
                        />
                      ) : null}
                      <a href={resumeDownloadUrl ?? "#"} target="_blank" rel="noreferrer">
                        <Button type="button" variant="secondary">
                          Download PDF
                        </Button>
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm text-[color:var(--app-heading)]">No resume yet</p>
                    <p className="text-sm text-[color:var(--app-muted)]">Upload one when you need it.</p>
                  </div>
                )}

                <details open={!currentResume} className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-medium text-[color:var(--app-heading)] [&::-webkit-details-marker]:hidden">
                    {currentResume ? "Replace resume" : "Upload resume"}
                  </summary>
                  <div className="mt-4 border-t border-[color:var(--app-border)] pt-4">
                    <ResumeUploader candidateId={candidate.id} hasResume={Boolean(currentResume)} />
                  </div>
                </details>
              </div>
            </section>

            <CandidateNotesModal
              candidateId={candidate.id}
              notes={candidate.notes.map((note) => ({
                id: note.id,
                type: note.type,
                body: note.body,
                createdAt: note.createdAt,
                author: note.createdByName || note.createdByEmail
              }))}
            />

            <section>
              <CandidateActivityModal items={activityFeed} />
            </section>
          </div>
        </div>

      </div>
    </SceneShell>
  );
}
