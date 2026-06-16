import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { CandidateActivityModal } from "@/components/candidates/CandidateActivityModal";
import {
  CandidateAssessmentsPanel,
  type CandidateProfilePlatformAssessment
} from "@/components/candidates/CandidateAssessmentsPanel";
import {
  CandidateScorecardsPanel,
  type ScorecardPanelItem
} from "@/components/candidates/CandidateScorecardsPanel";
import { CandidateMilestoneTimeline } from "@/components/candidates/CandidateMilestoneTimeline";
import { CandidateNotesModal } from "@/components/candidates/CandidateNotesModal";
import {
  CandidateApplicationHistoryPanel,
  CandidateLifecycleSummaryCard
} from "@/components/candidates/CandidateLifecycleOverview";
import { DefaultJourneySkeleton } from "@/components/candidates/DefaultJourneySkeleton";
import { CandidateSidebar } from "@/components/candidates/CandidateSidebar";
import { CandidatePipelineProgress } from "@/components/candidates/CandidatePipelineProgress";
import { CandidateOfferPanel } from "@/components/candidates/CandidateOfferPanel";
import { NextActionCard } from "@/components/candidates/NextActionCard";
import { EmailComposerModal } from "@/components/candidates/EmailComposerModal";
import { EmailLogPanel } from "@/components/candidates/EmailLogPanel";
import { FinalizeActionBar } from "@/components/candidates/FinalizeActionBar";
import { ResponsibleTeamCard } from "@/components/candidates/ResponsibleTeamCard";
import { ResumePreviewModal } from "@/components/candidates/ResumePreviewModal";
import { ResumeUploader } from "@/components/candidates/ResumeUploader";
import { CandidateAttachmentsSection } from "@/components/candidates/CandidateAttachmentsSection";
import { Button } from "@/components/primitives/Button";
import { SceneShell } from "@/components/scene/SceneShell";
import { StagePanel } from "@/components/scene/StagePanel";
import { listAddonCatalog, listAssessmentPresets } from "@/lib/addons/catalog";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { requirePageSession } from "@/lib/auth/guards";
import { canUsePermissionForDepartment } from "@/lib/auth/permission-evaluator";
import type { CandidateStage } from "@/lib/candidates/types";
import { buildCandidateActivityFeed } from "@/lib/candidates/workspace";
import { getApplicationAssignments } from "@/lib/db/hiring-assignments";
import { ensureCandidateMilestones, getCandidateDetail } from "@/lib/db/candidates";
import { getDepartment } from "@/lib/db/departments";
import { listDepartmentHiringTeamOptions } from "@/lib/db/hiring-team-templates";
import { prisma } from "@/lib/db/prisma";
import { getDepartmentWorkflowChannelState } from "@/lib/integrations/service";
import { isActiveApplicationStatus } from "@/lib/jobs/types";
import { safeLocalPath } from "@/lib/http/safe-local-path";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CandidateData = NonNullable<Awaited<ReturnType<typeof getCandidateDetail>>>;

const profileTabs = [
  { key: "pipeline", label: "Overview" },
  { key: "assessments", label: "Assessments" },
  { key: "scorecards", label: "Scorecards" },
  { key: "notes", label: "Notes" },
  { key: "files", label: "Files" },
  { key: "emails", label: "Emails" },
  { key: "offer", label: "Offer" },
  { key: "activity", label: "Activity" },
] as const;

type CandidateProfileTab = (typeof profileTabs)[number]["key"];

function parseProfileTab(value?: string | null): CandidateProfileTab {
  // migrate old tab keys (overview was renamed to pipeline internally)
  if (value === "progress") return "pipeline";
  return profileTabs.some((t) => t.key === value) ? (value as CandidateProfileTab) : "pipeline";
}

function safeExternalUrl(value?: string | null) {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.toString();
  } catch {
    return undefined;
  }
  return undefined;
}

function primaryApplication(candidate: CandidateData) {
  return (
    candidate.applications.find((a) => isActiveApplicationStatus(a.status)) ??
    candidate.applications[0] ??
    null
  );
}

function fallbackWorkspaceDepartmentId(candidate: CandidateData) {
  return (
    candidate.departmentCandidacies?.find((c) => c.status === "active")?.departmentId ??
    candidate.departmentId
  );
}

function buildPlatformAssessments(candidate: CandidateData): CandidateProfilePlatformAssessment[] {
  const milestoneTitleByAssessmentId = new Map(
    candidate.milestones
      .filter((milestone) => milestone.candidateAssessmentId)
      .map((milestone) => [milestone.candidateAssessmentId as string, milestone.title])
  );

  return candidate.assessments.map((assessment) => ({
    ...assessment,
    title: milestoneTitleByAssessmentId.get(assessment.id) ?? "Assessment invite",
    resultHref: assessment.attemptId ? (`/results/${assessment.attemptId}` as Route) : undefined
  }));
}

async function resolveWorkspaceContext({
  candidate,
  workspaceId,
  returnTo,
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
        backHref: (returnTo ?? candidateListHref) as Route,
      };
    }
  }

  const defaultCandidatesHref = (
    candidate.stage === "applicant" ? "/people/candidates/applicants" : "/people/candidates"
  ) as Route;
  return {
    kind: "admin" as const,
    label: "Admin workspace",
    workspaceHref: undefined,
    candidateListHref: defaultCandidatesHref,
    backHref: (returnTo ?? defaultCandidatesHref) as Route,
  };
}

function buildDetailPath(
  candidateId: string,
  workspaceId?: string,
  returnTo?: string,
  tab?: CandidateProfileTab
) {
  const params = new URLSearchParams();
  if (workspaceId) params.set("workspaceId", workspaceId);
  if (returnTo) params.set("returnTo", returnTo);
  if (tab && tab !== "pipeline") params.set("tab", tab);
  const query = params.toString();
  return `/people/candidates/${candidateId}${query ? `?${query}` : ""}`;
}

function ProfileTabs({
  candidateId,
  currentTab,
  workspaceId,
  returnTo,
}: {
  candidateId: string;
  currentTab: CandidateProfileTab;
  workspaceId?: string;
  returnTo?: string;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] p-1 text-sm shadow-[var(--app-shadow-soft)]">
      {profileTabs.map((tab) => {
        const href = buildDetailPath(candidateId, workspaceId, returnTo, tab.key) as Route;
        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80",
              currentTab === tab.key
                ? "bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--app-brand)_22%,transparent)]"
                : "text-[color:var(--app-muted)] hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default async function CandidateDetailPage({
  params,
  searchParams,
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
    tab?: string;
  }>;
}) {
  const { id } = await params;
  const pageState = await searchParams;
  const requestedWorkspaceId = pageState.workspaceId?.trim() || pageState.fromDepartment?.trim() || undefined;
  const returnTo = safeLocalPath(pageState.returnTo?.trim());
  const currentTab = parseProfileTab(pageState.tab);
  const requestPath = buildDetailPath(id, requestedWorkspaceId, returnTo, currentTab);
  const session = await requirePageSession(requestPath);
  const permission = await requireCandidatePermission(session, id, "view_candidates");
  if (!permission.ok) {
    if (permission.response.status === 404) notFound();
    redirect("/people/candidates");
  }

  let candidate = await getCandidateDetail(id);
  if (!candidate) notFound();

  const hasActiveHiringJourney =
    candidate.applications.length > 0 ||
    Boolean(candidate.departmentCandidacies?.some((c) => c.status === "active"));

  if (candidate.milestones.length === 0 && hasActiveHiringJourney) {
    await ensureCandidateMilestones(candidate.id);
    candidate = await getCandidateDetail(id);
    if (!candidate) notFound();
  }

  const activeApplication = primaryApplication(candidate);
  const platformAssessments = buildPlatformAssessments(candidate);
  const currentResume = candidate.resumes[0] ?? null;
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
    returnTo,
  });

  const [assignments, departmentCandidacy, offer, emailLogs, candidateAttachments] = await Promise.all([
    activeApplication ? getApplicationAssignments(activeApplication.id) : Promise.resolve([]),
    // Fetch most recent candidacy regardless of status so team/dept context survives rejection.
    // Use isActiveCandidacy to gate write operations.
    prisma.departmentCandidacy.findFirst({
      where: { candidateId: candidate.id },
      orderBy: { updatedAt: "desc" },
      include: {
        department: { select: { id: true, name: true } },
        teamAssignments: {
          where: { isActive: true },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    }).catch(() => null),
    prisma.candidateOffer.findUnique({
      where: { candidateId: candidate.id },
      include: {
        approvalSteps: {
          orderBy: { sortOrder: "asc" },
          include: {
            approver: { select: { id: true, name: true, email: true } }
          }
        }
      }
    }).catch(() => null),
    prisma.emailLog.findMany({
      where: { candidateId: candidate.id },
      orderBy: { sentAt: "desc" },
      take: 50,
      select: {
        id: true,
        to: true,
        cc: true,
        subject: true,
        template: true,
        status: true,
        errorMsg: true,
        sentAt: true,
        sentBy: { select: { id: true, name: true, email: true } },
      },
    }).catch(() => [] as Array<{ id: string; to: string; cc: string | null; subject: string; template: string; status: string; errorMsg: string | null; sentAt: Date; sentBy: { id: string; name: string | null; email: string } | null }>),
    prisma.candidateAttachment.findMany({
      where: { candidateId: candidate.id },
      orderBy: { uploadedAt: "desc" },
      take: 50,
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        storageUrl: true,
        label: true,
        uploadedAt: true,
      },
    }).catch(() => [] as Array<{ id: string; fileName: string; mimeType: string; sizeBytes: number; storageUrl: string; label: string | null; uploadedAt: Date }>),
  ]);

  const isActiveCandidacy = departmentCandidacy?.status === "active";

  const scorecardPanels: ScorecardPanelItem[] = currentTab === "scorecards"
    ? await prisma.interviewPanel.findMany({
        where: { candidateId: candidate.id },
        orderBy: { roundNumber: "asc" },
        include: {
          feedbacks: {
            orderBy: { createdAt: "asc" },
            include: { interviewer: { select: { id: true, name: true, email: true } } }
          }
        }
      }).then((rows) =>
        rows.map((p) => ({
          id: p.id,
          roundNumber: p.roundNumber,
          roundName: p.roundName,
          format: p.format,
          scheduledAt: p.scheduledAt?.toISOString() ?? null,
          status: p.status,
          feedbacks: p.feedbacks.map((fb) => ({
            id: fb.id,
            interviewerName: fb.interviewer.name,
            interviewerEmail: fb.interviewer.email,
            overallRating: fb.overallRating,
            recommendation: fb.recommendation,
            competencyJson: fb.competencyJson,
            strengths: fb.strengths,
            concerns: fb.concerns,
            submittedAt: fb.submittedAt?.toISOString() ?? null
          }))
        }))
      ).catch(() => [])
    : [];

  const scopeDepartmentId =
    candidate.departmentId ??
    departmentCandidacy?.department.id ??
    requestedWorkspaceId ??
    null;

  const [canManageCandidate, scopedPromoteCandidate, canDeleteCandidate] = await Promise.all([
    canUsePermissionForDepartment(session, "manage_candidates", scopeDepartmentId),
    activeApplication
      ? canUsePermissionForDepartment(session, "promote_candidate", scopeDepartmentId)
      : Promise.resolve(false),
    canUsePermissionForDepartment(session, "delete_candidate", scopeDepartmentId),
  ]);
  const canPromoteCandidate = canManageCandidate || scopedPromoteCandidate;

  const [assessmentAddons, assessmentPresets] = canManageCandidate
    ? await Promise.all([
        listAddonCatalog(false, requestedWorkspaceId ? { departmentId: requestedWorkspaceId } : undefined),
        listAssessmentPresets(
          requestedWorkspaceId
            ? { departmentId: requestedWorkspaceId, includeShared: true }
            : { includeInactive: false }
        ),
      ])
    : [[], []];

  const teamDepartmentId =
    activeApplication
      ? candidate.departmentId ?? departmentCandidacy?.department.id ?? requestedWorkspaceId
      : departmentCandidacy?.department.id ?? candidate.departmentId ?? requestedWorkspaceId;
  // Only wire offer workflow / team edit options when there is an active hiring journey
  const offerWorkflowDepartmentId = isActiveCandidacy
    ? (departmentCandidacy?.department.id ?? candidate.departmentId ?? requestedWorkspaceId ?? null)
    : null;
  const canEditTeam = canManageCandidate && Boolean(activeApplication || isActiveCandidacy);
  const teamOptions = (teamDepartmentId && canEditTeam)
    ? await listDepartmentHiringTeamOptions(teamDepartmentId)
    : { templates: [], users: [] };
  const approvalRoute = offerWorkflowDepartmentId
    ? await prisma.offerApprovalChain.findFirst({
        where: { departmentId: offerWorkflowDepartmentId },
        include: {
          steps: {
            orderBy: { sortOrder: "asc" },
            include: {
              approver: { select: { id: true, name: true, email: true } }
            }
          }
        }
      }).catch(() => null)
    : null;

  const teamAssignments = activeApplication
    ? assignments
    : departmentCandidacy?.teamAssignments.map((a) => ({
        id: a.id,
        user: a.user,
        assignmentRole: a.role,
        isPrimary: a.isPrimary,
        role: a.role,
        source: a.source as "template" | "manual" | "job_default",
      })) ?? [];

  const workflowDepartmentId =
    departmentCandidacy?.department.id ??
    candidate.departmentCandidacies?.find((c) => c.status === "active")?.departmentId ??
    candidate.departmentId ??
    requestedWorkspaceId ??
    null;
  const workflowChannels = workflowDepartmentId
    ? await getDepartmentWorkflowChannelState(workflowDepartmentId).catch(() => null)
    : null;

  const teamNames = teamAssignments.map((a) => a.user.name ?? a.user.email);
  const teamCount = teamAssignments.length;

  const availableInterviewers = Array.from(
    new Map(teamAssignments.map((a) => [a.user.id, a.user])).values()
  );

  const currentDetailPath = buildDetailPath(candidate.id, requestedWorkspaceId, returnTo, currentTab);
  const departmentName = departmentCandidacy?.department.name;

  const hiringTeamForEmail = teamAssignments.map((a) => ({ email: a.user.email, name: a.user.name ?? undefined }));
  const serializedEmailLogs = (emailLogs ?? []).map((l) => ({
    ...l,
    cc: l.cc ?? null,
    errorMsg: l.errorMsg ?? null,
    sentAt: l.sentAt instanceof Date ? l.sentAt.toISOString() : String(l.sentAt),
    sentBy: l.sentBy ? { id: l.sentBy.id, name: l.sentBy.name ?? null, email: l.sentBy.email } : null,
  }));

  const serializedAttachments = (candidateAttachments ?? []).map((a) => ({
    ...a,
    label: a.label ?? null,
    uploadedAt: a.uploadedAt instanceof Date ? a.uploadedAt.toISOString() : String(a.uploadedAt),
  }));

  // Map offer to a safe serializable shape; enforce expiry on the server
  const isOfferExpired =
    offer?.status === "sent" &&
    offer.expiresAt != null &&
    offer.expiresAt < new Date();

  const offerForPanel = offer
    ? {
        id: offer.id,
        status: (isOfferExpired ? "expired" : offer.status) as "draft" | "submitted_for_approval" | "approved" | "sent" | "accepted" | "rejected" | "expired",
        compensationType: offer.compensationType,
        compensationAmount: offer.compensationAmount,
        currency: offer.currency,
        targetStartDate: offer.targetStartDate?.toISOString() ?? null,
        expiresAt: offer.expiresAt?.toISOString() ?? null,
        offerNotes: offer.offerNotes,
        sentAt: offer.sentAt?.toISOString() ?? null,
        respondedAt: offer.respondedAt?.toISOString() ?? null,
        approvalSteps: offer.approvalSteps.map((step) => ({
          id: step.id,
          approverId: step.approverId,
          sortOrder: step.sortOrder,
          status: step.status,
          note: step.note,
          decidedAt: step.decidedAt?.toISOString() ?? null,
          approver: {
            id: step.approver.id,
            name: step.approver.name,
            email: step.approver.email
          }
        }))
      }
    : null;

  const hasResponsibleTeam = teamCount > 0;
  const hasLinkedJourney = hasActiveHiringJourney;
  const pipelineHref = buildDetailPath(candidate.id, requestedWorkspaceId, returnTo, "pipeline") as Route;
  const assessmentsHref = buildDetailPath(candidate.id, requestedWorkspaceId, returnTo, "assessments") as Route;
  const filesHref = buildDetailPath(candidate.id, requestedWorkspaceId, returnTo, "files") as Route;
  const emailsHref = buildDetailPath(candidate.id, requestedWorkspaceId, returnTo, "emails") as Route;
  const offerHref = buildDetailPath(candidate.id, requestedWorkspaceId, returnTo, "offer") as Route;

  const breadcrumbEyebrow =
    workspaceContext.kind === "department" ? (
      <span className="flex items-center gap-1.5">
        <Link
          href={workspaceContext.workspaceHref as Route}
          className="opacity-70 transition-opacity hover:opacity-100"
        >
          {workspaceContext.label}
        </Link>
        <span className="opacity-30">/</span>
        <Link
          href={workspaceContext.candidateListHref}
          className="opacity-70 transition-opacity hover:opacity-100"
        >
          Candidates
        </Link>
      </span>
    ) : (
      <Link
        href={workspaceContext.candidateListHref}
        className="opacity-70 transition-opacity hover:opacity-100"
      >
        Candidates
      </Link>
    );

  const backLabel =
    workspaceContext.kind === "department"
      ? `← ${workspaceContext.label} Candidates`
      : "← Candidates";

  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow={breadcrumbEyebrow}
      title={candidate.fullName}
      subtitle={candidate.roleLabel ?? candidate.email}
      utility={
        <Link href={workspaceContext.backHref}>
          <Button variant="secondary">{backLabel}</Button>
        </Link>
      }
    >
      {pageState.created || pageState.updated || pageState.noteAdded || pageState.resumeUploaded || pageState.error ? (
        <div className="mb-4 space-y-2">
          {pageState.created || pageState.updated ? (
            <div className="rounded-[16px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">Candidate updated.</div>
          ) : null}
          {pageState.noteAdded ? (
            <div className="rounded-[16px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">Note added.</div>
          ) : null}
          {pageState.resumeUploaded ? (
            <div className="rounded-[16px] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">Resume uploaded.</div>
          ) : null}
          {pageState.error ? (
            <div className="rounded-[16px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{pageState.error}</div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        {/* Sidebar */}
        <div className="w-full xl:w-[300px] xl:flex-shrink-0 xl:sticky xl:top-4">
          <CandidateSidebar
            candidate={candidate}
            currentDetailPath={currentDetailPath}
            backHref={workspaceContext.backHref}
            departmentName={departmentName}
            resumeDownloadUrl={resumeDownloadUrl}
            resumeFileName={currentResume?.fileName}
            canManage={canManageCandidate}
            canDelete={canDeleteCandidate}
            canPromote={canPromoteCandidate}
            activeApplication={activeApplication}
            teamCount={teamCount}
            teamNames={teamNames}
            offerStatus={offerForPanel?.status ?? null}
          />
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-4">
          {candidate.possibleDuplicates && candidate.possibleDuplicates.length > 0 ? (
            <div className="rounded-[16px] border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              <p className="font-medium mb-1">Possible duplicate record</p>
              <p className="text-amber-200/80 text-xs">
                Another candidate shares the same phone number:{" "}
                {candidate.possibleDuplicates.map((d, i) => (
                  <span key={d.id}>
                    {i > 0 ? ", " : ""}
                    <Link
                      href={`/people/candidates/${d.id}` as Route}
                      className="underline hover:text-amber-100"
                    >
                      {d.fullName}
                    </Link>
                  </span>
                ))}
                . Review both records before proceeding.
              </p>
            </div>
          ) : null}

          {candidate.stage === "finalized" ? (
            <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3 text-sm space-y-1">
              <p className="font-medium text-[color:var(--app-heading)]">
                {candidate.finalizedAs === "hired" ? "Hired" : "Not moving forward"}
              </p>
              <p className="text-[color:var(--app-muted)]">
                {candidate.finalizedAs === "hired"
                  ? "This candidate has been marked as hired."
                  : "This candidate's hiring journey has been closed. Transfer them to a department to re-open their candidacy."}
              </p>
            </div>
          ) : (!hasLinkedJourney || !hasResponsibleTeam) ? (
            <div className="rounded-[16px] border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 space-y-1">
              {!hasLinkedJourney ? <p>No active hiring journey — transfer this candidate to a department workspace to begin.</p> : null}
              {!hasResponsibleTeam && hasLinkedJourney ? <p>No hiring team assigned yet — use the hiring team card below to assign one.</p> : null}
            </div>
          ) : null}

          {hasLinkedJourney && candidate.milestones.length > 0 ? (
            <CandidatePipelineProgress
              milestones={candidate.milestones.map((m) => ({
                id: m.id,
                type: m.type,
                title: m.title,
                status: m.status,
                sortOrder: m.sortOrder,
              }))}
              pipelineHref={buildDetailPath(candidate.id, requestedWorkspaceId, returnTo, "pipeline") as Route}
            />
          ) : null}

          <NextActionCard
            hasResume={!!currentResume}
            hasLinkedJourney={hasLinkedJourney}
            hasTeam={hasResponsibleTeam}
            latestAssessmentStatus={candidate.assessments[0]?.status ?? null}
            assessmentsHref={assessmentsHref}
            filesHref={filesHref}
            pipelineHref={pipelineHref}
            offerStatus={offerForPanel?.status ?? null}
            offerHref={offerHref}
            candidateStage={candidate.stage}
          />

          <ProfileTabs
            candidateId={candidate.id}
            currentTab={currentTab}
            workspaceId={requestedWorkspaceId}
            returnTo={returnTo}
          />

          {/* Pipeline tab */}
          {currentTab === "pipeline" ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-4">
                <CandidateApplicationHistoryPanel
                  applications={candidate.applications}
                  applicationAssessments={candidate.applicationAssessments}
                />

                {candidate.milestones.length === 0 ? (
                  <div className="rounded-[16px] bg-[color:var(--app-surface-soft)] p-6">
                    <DefaultJourneySkeleton hasHiringJourney={hasActiveHiringJourney} />
                  </div>
                ) : (
                  <CandidateMilestoneTimeline
                    candidateId={candidate.id}
                    milestones={candidate.milestones}
                    hasResume={Boolean(currentResume)}
                    detailHref={currentDetailPath}
                    assessmentAddons={assessmentAddons}
                    assessmentPresets={assessmentPresets}
                    assessmentWorkspaceLabel={requestedWorkspaceId ? workspaceContext.label : undefined}
                    availableInterviewers={availableInterviewers}
                    schedulingChannel={workflowChannels?.scheduling}
                  />
                )}
              </div>

              <div className="space-y-4">
                <CandidateLifecycleSummaryCard
                  applications={candidate.applications}
                  platformAssessments={platformAssessments}
                  applicationAssessments={candidate.applicationAssessments}
                  externalAssessments={candidate.externalAssessments}
                  emailLogs={serializedEmailLogs.map((log) => ({
                    id: log.id,
                    status: log.status,
                    sentAt: log.sentAt,
                    subject: log.subject
                  }))}
                  hasResume={Boolean(currentResume)}
                  filesHref={filesHref}
                  assessmentsHref={assessmentsHref}
                  emailsHref={emailsHref}
                  pipelineHref={pipelineHref}
                />

                <FinalizeActionBar
                  candidateId={candidate.id}
                  orgStage={candidate.orgStage}
                  finalizedAs={candidate.finalizedAs}
                  permissions={session.permissions}
                />

                {(canManageCandidate || teamCount > 0) ? (
                  <ResponsibleTeamCard
                    mode={activeApplication ? "application" : "candidacy"}
                    entityId={activeApplication?.id || departmentCandidacy?.id || ""}
                    assignments={teamAssignments}
                    users={teamOptions.users}
                    templates={teamOptions.templates}
                    canEdit={canEditTeam}
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Assessments tab */}
          {currentTab === "assessments" ? (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-[color:var(--app-heading)]">
                  Assessments
                </h2>
                <p className="text-sm text-[color:var(--app-muted)]">
                  Assessments and screening results
                </p>
              </div>
              <CandidateAssessmentsPanel
                candidateId={candidate.id}
                candidateEmail={candidate.email}
                platformAssessments={platformAssessments}
                applicationAssessments={candidate.applicationAssessments}
                externalAssessments={candidate.externalAssessments}
                canManage={canManageCandidate}
              />
            </div>
          ) : null}

          {/* Scorecards tab */}
          {currentTab === "scorecards" ? (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-[color:var(--app-heading)]">Scorecards</h2>
                <p className="text-sm text-[color:var(--app-muted)]">
                  Interviewer feedback and ratings, aggregated by round.
                </p>
              </div>
              <CandidateScorecardsPanel panels={scorecardPanels} />
            </div>
          ) : null}

          {/* Notes tab */}
          {currentTab === "notes" ? (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-[color:var(--app-heading)]">Notes</h2>
              <CandidateNotesModal
                candidateId={candidate.id}
                notes={candidate.notes.map((note) => ({
                  id: note.id,
                  type: note.type,
                  body: note.body,
                  createdAt: note.createdAt,
                  author: note.createdByName || note.createdByEmail,
                }))}
              />
            </div>
          ) : null}

          {/* Activity tab */}
          {currentTab === "activity" ? (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-[color:var(--app-heading)]">Activity</h2>
              <CandidateActivityModal items={activityFeed} />
            </div>
          ) : null}

          {/* Files tab */}
          {currentTab === "files" ? (
            <div id="resume" className="space-y-5">
              <h2 className="text-xl font-semibold text-[color:var(--app-heading)]">Files</h2>
              <StagePanel tone="flat" className="space-y-4">
                {currentResume ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[color:var(--app-heading)]">{currentResume.fileName}</p>
                      <p className="text-xs text-[color:var(--app-muted)]">
                        {Math.max(1, Math.round(currentResume.sizeBytes / 1024))} KB · Uploaded{" "}
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
                        <Button type="button" variant="secondary">Download PDF</Button>
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[color:var(--app-heading)]">No resume on file</p>
                    <p className="text-xs text-[color:var(--app-muted)]">Upload one below.</p>
                  </div>
                )}
                <details open={!currentResume} className="rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-medium text-[color:var(--app-heading)] [&::-webkit-details-marker]:hidden">
                    {currentResume ? "Replace resume" : "Upload resume"}
                  </summary>
                  <div className="mt-4 border-t border-[color:var(--app-border)] pt-4">
                    <ResumeUploader candidateId={candidate.id} hasResume={Boolean(currentResume)} />
                  </div>
                </details>
              </StagePanel>

              <div className="border-t border-[color:var(--app-border)] pt-4">
                <CandidateAttachmentsSection
                  candidateId={candidate.id}
                  initialAttachments={serializedAttachments}
                  canManage={canManageCandidate}
                />
              </div>

              {safeExternalUrl(candidate.candidateFolderUrl) ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-[color:var(--app-heading)]">Shared folder</h3>
                  <a href={safeExternalUrl(candidate.candidateFolderUrl)} target="_blank" rel="noreferrer">
                    <Button type="button" variant="secondary">Open shared folder</Button>
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Emails tab */}
          {currentTab === "emails" ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-[color:var(--app-heading)]">Emails</h2>
                  <p className="text-sm text-[color:var(--app-muted)]">
                    Send emails to the candidate and loop in the hiring team.
                  </p>
                </div>
                <EmailComposerModal
                  candidateId={candidate.id}
                  candidateEmail={candidate.email}
                  candidateName={candidate.fullName}
                  hiringTeam={hiringTeamForEmail}
                  deliveryChannel={workflowChannels?.email}
                />
              </div>
              <EmailLogPanel
                candidateId={candidate.id}
                initialLogs={serializedEmailLogs}
                deliveryChannel={workflowChannels?.email}
              />
            </div>
          ) : null}

          {/* Offer tab */}
          {currentTab === "offer" ? (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-[color:var(--app-heading)]">Offer</h2>
                <p className="text-sm text-[color:var(--app-muted)]">
                  Draft, send, and track the offer for this candidate.
                </p>
              </div>
              <CandidateOfferPanel
                candidateId={candidate.id}
                initialOffer={offerForPanel}
                canManage={canManageCandidate}
                currentUserId={session.userId ?? null}
                approvalRoute={
                  approvalRoute?.steps.map((step) => ({
                    approverId: step.approverId,
                    sortOrder: step.sortOrder,
                    approverName: step.approver.name,
                    approverEmail: step.approver.email
                  })) ?? []
                }
              />
            </div>
          ) : null}
        </div>
      </div>
    </SceneShell>
  );
}
