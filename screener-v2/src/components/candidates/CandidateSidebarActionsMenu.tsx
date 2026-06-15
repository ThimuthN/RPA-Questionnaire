"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { MoreHorizontal, ExternalLink } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { EditCandidateInfoModal } from "@/components/candidates/EditCandidateInfoModal";
import { TransferCandidateAction } from "@/components/candidates/TransferCandidateAction";
import { AnonymizeDataAction } from "@/components/candidates/AnonymizeDataAction";
import type { CandidateDetail } from "@/lib/db/candidates";
import { cn } from "@/lib/utils";

export function CandidateSidebarActionsMenu({
  candidate,
  currentDetailPath,
  backHref,
  resumeDownloadUrl,
  resumeFileName,
  folderHref,
  canManage,
  canDelete,
  isInPool,
  showMoveToPipeline,
  activeApplicationId,
}: {
  candidate: CandidateDetail;
  currentDetailPath: string;
  backHref: string;
  resumeDownloadUrl: string | null;
  resumeFileName?: string;
  folderHref?: string;
  canManage: boolean;
  canDelete: boolean;
  isInPool: boolean;
  showMoveToPipeline: boolean;
  activeApplicationId?: string;
}) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [anonymizeOpen, setAnonymizeOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [poolBusy, setPoolBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [menuOpen]);

  async function togglePool() {
    setPoolBusy(true);
    setMenuOpen(false);
    try {
      await fetch(`/api/candidates/${candidate.id}/org-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgStatus: isInPool ? "active" : "talent_pool" }),
      });
      router.refresh();
    } finally {
      setPoolBusy(false);
    }
  }

  const hasMenuItems =
    !!resumeDownloadUrl ||
    !!folderHref ||
    (canManage && candidate.orgStage !== "finalized") ||
    canDelete;

  const visible = showMoveToPipeline || canManage || hasMenuItems;
  if (!visible) return null;

  return (
    <div className="border-t border-[color:var(--app-border)] p-4 space-y-2">
      {/* Move to pipeline — primary CTA */}
      {showMoveToPipeline && activeApplicationId ? (
        <form action={`/api/candidate-applications/${activeApplicationId}`} method="post">
          <input type="hidden" name="action" value="promote" />
          <input type="hidden" name="returnTo" value={currentDetailPath} />
          <Button type="submit" className="w-full">
            Move to pipeline
          </Button>
        </form>
      ) : null}

      {/* Secondary actions row */}
      {(canManage || hasMenuItems) ? (
        <div className="flex items-center gap-1.5">
          {canManage ? (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex-1 rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-xs font-medium text-[color:var(--app-text)] transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]"
            >
              Edit info
            </button>
          ) : null}

          {hasMenuItems ? (
            <div ref={menuRef} className={cn("relative", !canManage && "flex-1")}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="More actions"
                aria-expanded={menuOpen}
                className={cn(
                  "flex items-center justify-center rounded-[14px] border px-2.5 py-2 text-[color:var(--app-text)] transition",
                  !canManage && "w-full gap-2 px-3",
                  menuOpen
                    ? "border-[color:var(--app-brand)] bg-[color:var(--app-brand)]/10 text-[color:var(--app-brand)]"
                    : "border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]"
                )}
              >
                {!canManage ? <span className="text-xs font-medium">Actions</span> : null}
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {menuOpen ? (
                <div className="absolute bottom-full right-0 mb-1.5 z-50 w-52 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
                  {/* Resource links */}
                  {resumeDownloadUrl && resumeFileName ? (
                    <a
                      href={resumeDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]"
                    >
                      Download resume
                    </a>
                  ) : null}
                  {folderHref ? (
                    <a
                      href={folderHref}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]"
                    >
                      <ExternalLink className="h-3.5 w-3.5 opacity-50 shrink-0" />
                      Open shared folder
                    </a>
                  ) : null}

                  {/* Mid-tier management actions */}
                  {canManage && candidate.orgStage !== "finalized" ? (
                    <>
                      {(resumeDownloadUrl || folderHref) ? (
                        <div className="my-1 border-t border-[color:var(--app-border)]" />
                      ) : null}
                      <button
                        type="button"
                        disabled={poolBusy}
                        onClick={() => void togglePool()}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)] disabled:opacity-50"
                      >
                        {poolBusy ? "Saving…" : isInPool ? "Remove from talent pool" : "Add to talent pool"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTransferOpen(true); setMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]"
                      >
                        Transfer department
                      </button>
                    </>
                  ) : null}

                  {/* Destructive actions */}
                  {canDelete ? (
                    <>
                      <div className="my-1 border-t border-[color:var(--app-border)]" />
                      <button
                        type="button"
                        onClick={() => { setAnonymizeOpen(true); setMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-amber-400 transition hover:bg-amber-500/10"
                      >
                        Anonymize data
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDeleteConfirmOpen(true); setMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-[color:var(--app-danger)] transition hover:bg-[color:var(--app-danger-soft)]"
                      >
                        Delete record
                      </button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Controlled modals — no trigger buttons rendered */}
      {canManage ? (
        <EditCandidateInfoModal
          candidate={candidate}
          returnTo={currentDetailPath}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}
      {canManage && candidate.orgStage !== "finalized" ? (
        <TransferCandidateAction
          candidateId={candidate.id}
          open={transferOpen}
          onOpenChange={setTransferOpen}
        />
      ) : null}
      {canDelete ? (
        <AnonymizeDataAction
          candidateId={candidate.id}
          candidateName={candidate.fullName}
          backHref={backHref}
          open={anonymizeOpen}
          onOpenChange={setAnonymizeOpen}
        />
      ) : null}

      {/* Delete confirmation portal */}
      {mounted && deleteConfirmOpen ? createPortal(
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-[rgba(3,8,20,0.78)] p-4 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirmOpen(false); }}
        >
          <div className="w-full max-w-sm space-y-4 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-6 shadow-[var(--app-modal-shadow)]">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[color:var(--app-heading)]">Delete record</h2>
              <p className="text-sm text-[color:var(--app-muted)]">
                This permanently removes <strong className="text-[color:var(--app-text)]">{candidate.fullName}</strong> and all linked lifecycle data. Use{" "}
                <span className="font-medium text-amber-400">Anonymize data</span> instead to preserve pipeline history.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <form action={`/api/candidates/${candidate.id}/delete`} method="post">
                <input type="hidden" name="returnTo" value={backHref} />
                <Button type="submit" variant="secondary">Delete</Button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
