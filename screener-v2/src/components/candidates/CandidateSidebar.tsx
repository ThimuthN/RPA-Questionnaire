import type { Route } from "next";
import { Mail, Phone, MapPin, ExternalLink, Linkedin } from "lucide-react";
import { StatusPill } from "@/components/primitives/StatusPill";
import { Button } from "@/components/primitives/Button";
import { ConfirmSubmitButton } from "@/components/primitives/ConfirmSubmitButton";
import { EditCandidateInfoModal } from "@/components/candidates/EditCandidateInfoModal";
import { TransferCandidateAction } from "@/components/candidates/TransferCandidateAction";
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
}) {
  const folderHref = safeExternalUrl(candidate.candidateFolderUrl);
  const linkedInHref = safeExternalUrl(candidate.linkedInUrl);
  const stage = candidate.stage as CandidateStage;

  const showMoveToPipeline =
    candidate.stage === "applicant" && !!activeApplication && canPromote;
  const hasActions =
    showMoveToPipeline ||
    canManage ||
    !!resumeDownloadUrl ||
    !!folderHref ||
    canDelete;

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
        {hasActions ? (
          <div className="space-y-2 border-t border-[color:var(--app-border)] p-4">
            {showMoveToPipeline ? (
              <form action={`/api/candidate-applications/${activeApplication!.id}`} method="post">
                <input type="hidden" name="action" value="promote" />
                <input type="hidden" name="returnTo" value={currentDetailPath} />
                <Button type="submit" className="w-full">
                  Move to pipeline
                </Button>
              </form>
            ) : null}

            {canManage ? (
              <EditCandidateInfoModal candidate={candidate} returnTo={currentDetailPath} />
            ) : null}

            {resumeDownloadUrl && resumeFileName ? (
              <a
                href={resumeDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-xs font-medium text-[color:var(--app-text)] transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]"
              >
                Download resume
              </a>
            ) : null}

            {folderHref ? (
              <a
                href={folderHref}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-xs font-medium text-[color:var(--app-text)] transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]"
              >
                <ExternalLink size={12} />
                Open shared folder
              </a>
            ) : null}

            {canManage && candidate.orgStage !== "finalized" ? (
              <TransferCandidateAction candidateId={candidate.id} />
            ) : null}

            {canDelete ? (
              <form action={`/api/candidates/${candidate.id}/delete`} method="post">
                <input type="hidden" name="returnTo" value={backHref} />
                <ConfirmSubmitButton
                  variant="secondary"
                  confirmMessage={`Delete ${candidate.fullName}? This removes the candidate and all linked lifecycle data.`}
                >
                  Delete record
                </ConfirmSubmitButton>
              </form>
            ) : null}
          </div>
        ) : null}
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
