"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2, X } from "lucide-react";
import { CandidateNoteTypePill } from "@/components/candidates/CandidatePills";
import { Button } from "@/components/primitives/Button";
import { ChoicePills } from "@/components/primitives/ChoicePills";
import { StatusPill } from "@/components/primitives/StatusPill";
import { candidateNoteTypeLabels, candidateNoteTypeValues } from "@/lib/candidates/types";

type CandidateNoteItem = {
  id: string;
  type: (typeof candidateNoteTypeValues)[number];
  body: string;
  createdAt: string;
  author?: string | null;
};

function NoteItem({
  note,
  index,
  candidateId,
  reduceMotion
}: {
  note: CandidateNoteItem;
  index: number;
  candidateId: string;
  reduceMotion: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState(note.body);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!editedBody.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editedBody })
      });
      if (res.ok) {
        setIsEditing(false);
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this note? This action cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/candidates/${candidateId}/notes/${note.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4"
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.24, delay: reduceMotion ? 0 : index * 0.04 }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <CandidateNoteTypePill type={note.type} />
          <StatusPill label={new Date(note.createdAt).toLocaleString()} tone="neutral" />
          {note.author ? (
            <StatusPill label={`by ${note.author}`} tone="neutral" className="normal-case tracking-normal" />
          ) : null}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
                setEditedBody(note.body);
              } else {
                setIsEditing(true);
              }
            }}
            disabled={isSaving || isDeleting}
            className="rounded-lg p-2 text-xs hover:bg-[color:var(--app-control-bg)] disabled:opacity-50"
            title={isEditing ? "Cancel" : "Edit note"}
          >
            {isEditing ? <X size={16} /> : <Pencil size={16} />}
          </button>
          <button
            onClick={handleDelete}
            disabled={isSaving || isDeleting}
            className="rounded-lg p-2 text-xs hover:bg-[color:var(--app-danger-soft)] disabled:opacity-50"
            title="Delete note"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {isEditing ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            rows={6}
            className="w-full rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !editedBody.trim() || editedBody === note.body}
              className="px-3 py-1.5 text-sm"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedBody(note.body);
              }}
              disabled={isSaving}
              className="rounded-lg px-3 py-1.5 text-sm hover:bg-[color:var(--app-control-bg)]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--app-text)]">{note.body}</p>
      )}
    </motion.div>
  );
}

export function CandidateNotesModal({
  candidateId,
  notes
}: {
  candidateId: string;
  notes: CandidateNoteItem[];
}) {
  const reduceMotion = Boolean(useReducedMotion());
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const activeNotes = notes.filter(note => !(note as any).deletedAt);
  const latestNote = activeNotes[0] ?? null;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <div className="space-y-3 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl text-[color:var(--app-heading)]">Notes</h2>
            <p className="text-sm text-[color:var(--app-muted)]">Latest notes for this candidate.</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
            View notes
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill label={`${activeNotes.length} note${activeNotes.length === 1 ? "" : "s"}`} tone="neutral" />
          {latestNote ? <StatusPill label={new Date(latestNote.createdAt).toLocaleString()} tone="neutral" /> : null}
        </div>

        {latestNote ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <CandidateNoteTypePill type={latestNote.type} />
              {latestNote.author ? (
                <StatusPill label={`by ${latestNote.author}`} tone="neutral" className="normal-case tracking-normal" />
              ) : null}
            </div>
            <p className="text-sm leading-6 text-[color:var(--app-text)]">{latestNote.body}</p>
          </div>
        ) : (
          <p className="text-sm text-[color:var(--app-muted)]">No notes yet.</p>
        )}
      </div>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto p-4 md:p-6"
                  style={{
                    background:
                      "radial-gradient(circle at top, color-mix(in srgb, var(--app-brand) 14%, transparent), transparent 24%), var(--app-modal-overlay)"
                  }}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, backdropFilter: "blur(10px)" }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-[color:var(--app-border)] shadow-[var(--app-modal-shadow)]"
                    style={{ background: "var(--app-modal-surface)" }}
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985, filter: "blur(10px)" }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.992, filter: "blur(8px)" }}
                    transition={{ duration: reduceMotion ? 0.14 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div
                      className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--app-border)] px-5 py-4 md:px-6 md:py-5"
                      style={{ background: "var(--app-modal-header)" }}
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <StatusPill label="Notes" tone="blue" />
                          <StatusPill label={`${activeNotes.length} active`} tone="neutral" />
                        </div>
                        <div>
                          <h3 className="text-xl text-[color:var(--app-heading)]">Candidate notes</h3>
                          <p className="text-sm text-[color:var(--app-muted)]">Add notes and keep the full history in one place.</p>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                        Close
                      </Button>
                    </div>

                    <div className="grid gap-5 overflow-y-auto p-4 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:p-5" style={{ background: "var(--app-modal-body)" }}>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setIsSubmitting(true);
                          setSubmitError(null);

                          const formData = new FormData(e.currentTarget);
                          try {
                            const response = await fetch(`/api/candidates/${candidateId}/notes`, {
                              method: "POST",
                              body: formData
                            });

                            if (!response.ok) {
                              const text = await response.text();
                              throw new Error(text || `API error: ${response.status}`);
                            }

                            // Success - reload page to get fresh data
                            window.location.reload();
                          } catch (err) {
                            setSubmitError(err instanceof Error ? err.message : "Failed to add note");
                            setIsSubmitting(false);
                          }
                        }}
                        className="space-y-4 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4"
                      >
                        <div className="space-y-1">
                          <h4 className="text-lg text-[color:var(--app-heading)]">Add note</h4>
                          <p className="text-sm text-[color:var(--app-muted)]">Keep it short and useful.</p>
                        </div>

                        {submitError && (
                          <div className="rounded-[16px] border border-[color:var(--app-danger-border)] bg-[color:var(--app-danger-soft)] p-3 text-sm text-[color:var(--app-danger)]">
                            {submitError}
                          </div>
                        )}

                        <div className="grid gap-2">
                          <span className="text-sm text-[color:var(--app-text)]">Type</span>
                          <div className={isSubmitting ? "opacity-50 pointer-events-none" : ""}>
                            <ChoicePills
                              name="type"
                              idPrefix={`candidate-note-type-${candidateId}`}
                              defaultValue="general"
                              required
                              options={candidateNoteTypeValues.map((value) => ({
                                value,
                                label: candidateNoteTypeLabels[value]
                              }))}
                            />
                          </div>
                        </div>

                        <label className="grid gap-1">
                          <span className="text-sm text-[color:var(--app-text)]">Note</span>
                          <textarea
                            name="body"
                            rows={8}
                            required
                            disabled={isSubmitting}
                            minLength={2}
                            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
                          />
                        </label>

                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Adding note..." : "Add note"}
                        </Button>
                      </form>

                      <div className="space-y-3">
                        {activeNotes.length === 0 ? (
                          <div className="rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                            <p className="text-sm text-[color:var(--app-muted)]">No notes yet.</p>
                          </div>
                        ) : (
                          activeNotes.map((note, index) => (
                            <NoteItem
                              key={note.id}
                              note={note}
                              index={index}
                              candidateId={candidateId}
                              reduceMotion={reduceMotion}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  );
}
