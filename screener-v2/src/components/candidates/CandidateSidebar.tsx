import type { Route } from "next";
import { Mail, Phone, MapPin, Linkedin } from "lucide-react";
import { StatusPill } from "@/components/primitives/StatusPill";
import { CandidateSidebarActionsMenu } from "@/components/candidates/CandidateSidebarActionsMenu";
import type { CandidateDetail } from "@/lib/db/candidates";
import type { CandidateStage } from "@/lib/candidates/types";
import { getCandidateStageLabel } from "@/lib/candidates/lifecycle";
import type { CandidateApplicationRecord } from "@/lib/db/candidates/types";
import type { CandidateApplicationStatus } from "@/lib/jobs/types";
import { candidateApplicationStatusLabels } from "@/lib/jobs/types";

function stageTone(stage: CandidateStage): "amber" | "blue" | "emerald" | "neutral" {
  if (stage === "applicant") return "amber";
  if (stage === "finalized") return "emerald";
  return "blue";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function safeExternalUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.toString();
  } catch {
    return undefined;
  }
  return undefined;
}

function applicationStatusTone(
  status: CandidateApplicationStatus
): "neutral" | "blue" | "amber" | "emerald" {
  if (status === "under_review") return "amber";
  if (status === "moved_to_pipeline") return "emerald";
  if (status === "closed") return "blue";
  return "neutral";
}

const SOURCE_LABELS: Record<string, string> = {
  direct: "Company website",
  linkedin: "LinkedIn",
  job_board: "Job board",
  referral: "Referral",
  agency: "Agency",
  other: "Other",
};

function applicationSourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

const OFFER_STATUS_LABELS: Record<string, string> = {
  draft: "Offer draft",
  submitted_for_approval: "Awaiting approval",
  approved: "Offer approved",
  sent: "Offer sent",
  accepted: "Offer accepted",
  rejected: "Offer declined",
  expired: "Offer expired",
};

const OFFER_STATUS_TONES: Record<string, "neutral" | "blue" | "amber" | "emerald"> = {
  draft: "neutral",
  submitted_for_approval: "amber",
  approved: "blue",
  sent: "blue",
  accepted: "emerald",
  rejected: "neutral",
  expired: "neutral",
};

export function CandidateSidebar({
  candidate,
  currentDetailPath,
  backHref,
  departmentName,
  resumeDownloadUrl,
  resumeFileName,
  canManage,
  canDelete,
  canPromote,
  activeApplication,
  teamCount,
  teamNames,
  offerStatus,
}: {
  candidate: CandidateDetail;
  currentDetailPath: string;
  backHref: Route;
  departmentName?: string;
  resumeDownloadUrl: string | null;
  resumeFileName?: string;
  canManage: boolean;
  canDelete: boolean;
  canPromote: boolean;
  activeApplication: CandidateApplicationRecord | null;
  teamCount: number;
  teamNames: string[];
  offerStatus?: string | null;
}) {
  const folderHref = safeExternalUrl(candidate.candidateFolderUrl);
  const linkedInHref = safeExternalUrl(candidate.linkedInUrl);
  const stage = (candidate.orgStage === "finalized" ? "finalized" : candidate.stage) as CandidateStage;

  const showMoveToPipeline =
    candidate.stage === "applicant" && !!activeApplication && canPromote;

  return (
    <aside>
      <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
        {/* ── Identity ── */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--app-brand),var(--app-brand-strong))] text-sm font-semibold text-white select-none">
              {initials(candidate.fullName)}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-semibold leading-tight text-[color:var(--app-heading)] truncate">
                {candidate.fullName}
              </p>
              {candidate.currentTitle ? (
                <p className="text-xs text-[color:var(--app-muted)] truncate">
                  {candidate.currentTitle}
                </p>
              ) : null}
              <StatusPill label={getCandidateStageLabel(stage)} tone={stageTone(stage)} />
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-2 border-t border-[color:var(--app-border)] pt-3 text-xs">
            <ContactRow icon={<Mail size={12} />} value={candidate.email} />
            {candidate.phone ? (
              <ContactRow icon={<Phone size={12} />} value={candidate.phone} />
            ) : null}
            {candidate.location ? (
              <ContactRow icon={<MapPin size={12} />} value={candidate.location} />
            ) : null}
            {(!candidate.phone || !candidate.location) ? (
              <p className="text-[10px] text-[color:var(--app-muted)] italic">
                {[!candidate.phone && "Phone missing", !candidate.location && "Location missing"].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {linkedInHref ? (
              <a
                href={linkedInHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-brand-400 hover:underline"
              >
                <Linkedin size={12} className="flex-shrink-0" />
                <span className="truncate">LinkedIn</span>
              </a>
            ) : null}
          </div>

          {/* Role / department / meta */}
          <div className="space-y-2 border-t border-[color:var(--app-border)] pt-3">
            {candidate.roleLabel ? (
              <MetaRow label="Role" value={candidate.roleLabel} />
            ) : null}
            {(departmentName ?? candidate.departmentName) ? (
              <MetaRow label="Department" value={departmentName ?? candidate.departmentName!} />
            ) : null}
            {candidate.salaryExpectation ? (
              <MetaRow label="Expected salary" value={candidate.salaryExpectation} />
            ) : null}
            <MetaRow label="Source" value={candidate.resumeSource ?? "Not recorded"} />
            <MetaRow label="Added" value={new Date(candidate.createdAt).toLocaleDateString()} />
            {candidate.batchId ? (
              <MetaRow label="Batch" value={candidate.batchId} />
            ) : null}
          </div>

          {/* Application */}
          {activeApplication ? (
            <div className="space-y-1.5 border-t border-[color:var(--app-border)] pt-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
                Application
              </p>
              <p className="text-xs font-medium text-[color:var(--app-heading)] truncate">
                {activeApplication.jobTitle}
              </p>
              <StatusPill
                label={candidateApplicationStatusLabels[activeApplication.status]}
                tone={applicationStatusTone(activeApplication.status)}
              />
              <p className="text-[10px] text-[color:var(--app-muted)]">
                Applied {new Date(activeApplication.createdAt).toLocaleDateString()}
              </p>
              {activeApplication.source ? (
                <MetaRow label="Via" value={applicationSourceLabel(activeApplication.source)} />
              ) : null}
              {activeApplication.source === "referral" && activeApplication.referredBy ? (
                <MetaRow label="Referred by" value={activeApplication.referredBy} />
              ) : null}
            </div>
          ) : null}

          {/* Offer status (surface without making user open the Offer tab) */}
          {offerStatus && offerStatus !== "draft" ? (
            <div className="space-y-1.5 border-t border-[color:var(--app-border)] pt-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
                Offer
              </p>
              <StatusPill
                label={OFFER_STATUS_LABELS[offerStatus] ?? offerStatus}
                tone={OFFER_STATUS_TONES[offerStatus] ?? "neutral"}
              />
            </div>
          ) : null}

          {/* Hiring team */}
          <div className="space-y-1.5 border-t border-[color:var(--app-border)] pt-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
              Hiring team
            </p>
            {teamCount > 0 ? (
              <p className="text-xs text-[color:var(--app-text)]">
                {teamNames.slice(0, 3).join(", ")}
                {teamCount > 3 ? ` +${teamCount - 3} more` : ""}
              </p>
            ) : (
              <p className="text-xs text-amber-400">No hiring team assigned</p>
            )}
          </div>

          {/* Notes summary */}
          {candidate.notesSummary ? (
            <div className="space-y-1.5 border-t border-[color:var(--app-border)] pt-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
                Recruiter notes
              </p>
              <p className="text-xs leading-5 text-[color:var(--app-text)] line-clamp-3">
                {candidate.notesSummary}
              </p>
            </div>
          ) : null}
        </div>

        {/* ── Actions ── */}
        <CandidateSidebarActionsMenu
          candidate={candidate}
          currentDetailPath={currentDetailPath}
          backHref={String(backHref)}
          resumeDownloadUrl={resumeDownloadUrl}
          resumeFileName={resumeFileName}
          folderHref={folderHref ?? undefined}
          canManage={canManage}
          canDelete={canDelete}
          isInPool={candidate.orgStatus === "talent_pool"}
          showMoveToPipeline={showMoveToPipeline}
          activeApplicationId={activeApplication?.id}
        />
      </div>
    </aside>
  );
}

function ContactRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[color:var(--app-text)]">
      <span className="flex-shrink-0 text-[color:var(--app-muted)]">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="flex-shrink-0 text-[11px] text-[color:var(--app-muted)]">{label}</span>
      <span className="truncate text-right text-xs text-[color:var(--app-heading)]">{value}</span>
    </div>
  );
}
