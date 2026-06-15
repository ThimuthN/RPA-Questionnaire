"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { BoardColumn, BoardCandidate } from "@/app/people/candidates/board/page";

const STAGE_COLORS: Record<string, string> = {
  pipeline: "bg-blue-500/15 border-blue-400/30 text-blue-200",
  screening: "bg-amber-500/15 border-amber-400/30 text-amber-200",
  interview: "bg-purple-500/15 border-purple-400/30 text-purple-200",
  advanced_review: "bg-cyan-500/15 border-cyan-400/30 text-cyan-200",
  finalized: "bg-emerald-500/15 border-emerald-400/30 text-emerald-200",
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function CandidateCard({
  candidate,
  onDragStart,
  canEdit,
}: {
  candidate: BoardCandidate;
  onDragStart: (e: React.DragEvent, candidateId: string) => void;
  canEdit: boolean;
}) {
  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => onDragStart(e, candidate.id)}
      className={`group rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-3.5 transition ${
        canEdit ? "cursor-grab active:cursor-grabbing hover:border-[color:var(--app-border-strong)]" : ""
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-[11px] font-bold text-brand-300">
          {initials(candidate.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/people/candidates/${candidate.id}` as Route}
            className="block truncate text-sm font-medium text-[color:var(--app-heading)] hover:underline"
          >
            {candidate.fullName}
          </Link>
          {candidate.currentTitle || candidate.roleLabel ? (
            <p className="truncate text-xs text-[color:var(--app-muted)]">
              {candidate.currentTitle ?? candidate.roleLabel}
            </p>
          ) : (
            <p className="truncate text-xs text-[color:var(--app-muted)]">{candidate.email}</p>
          )}
        </div>
      </div>
      {candidate.staleDays > 0 && (
        <p className={`mt-2 text-[10px] font-medium ${candidate.staleDays > 14 ? "text-amber-400" : "text-[color:var(--app-muted)]"}`}>
          {candidate.staleDays}d in stage{candidate.staleDays > 14 ? " — needs attention" : ""}
        </p>
      )}
    </div>
  );
}

export function CandidateWorkspaceBoard({
  columns: initialColumns,
  canEdit,
}: {
  columns: BoardColumn[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [columns, setColumns] = useState(initialColumns);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onDragStart = useCallback((e: React.DragEvent, candidateId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("candidateId", candidateId);
    setDraggingId(candidateId);
  }, []);

  const onDragEnd = useCallback(() => {
    setDraggingId(null);
    setDragOverStage(null);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent, targetStage: string) => {
      e.preventDefault();
      const candidateId = e.dataTransfer.getData("candidateId");
      setDraggingId(null);
      setDragOverStage(null);

      if (!candidateId) return;

      const sourceColumn = columns.find((c) => c.candidates.some((cand) => cand.id === candidateId));
      if (!sourceColumn || sourceColumn.stage === targetStage) return;

      const candidate = sourceColumn.candidates.find((c) => c.id === candidateId)!;

      // Optimistic update
      setColumns((prev) =>
        prev.map((col) => {
          if (col.stage === sourceColumn.stage) {
            return { ...col, candidates: col.candidates.filter((c) => c.id !== candidateId) };
          }
          if (col.stage === targetStage) {
            return { ...col, candidates: [{ ...candidate, stage: targetStage }, ...col.candidates] };
          }
          return col;
        })
      );

      setPending((p) => new Set(p).add(candidateId));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[candidateId];
        return next;
      });

      try {
        const res = await fetch(`/api/candidates/${candidateId}/promote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetStage }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message ?? "Could not advance stage.");
        }
        router.refresh();
      } catch (err) {
        // Revert
        setColumns((prev) =>
          prev.map((col) => {
            if (col.stage === targetStage) {
              return { ...col, candidates: col.candidates.filter((c) => c.id !== candidateId) };
            }
            if (col.stage === sourceColumn.stage) {
              return { ...col, candidates: [...col.candidates, candidate] };
            }
            return col;
          })
        );
        setErrors((prev) => ({
          ...prev,
          [candidateId]: err instanceof Error ? err.message : "Error",
        }));
      } finally {
        setPending((p) => {
          const next = new Set(p);
          next.delete(candidateId);
          return next;
        });
      }
    },
    [columns, router]
  );

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex min-w-max gap-3 pb-4">
        {columns.map((col) => {
          const isOver = dragOverStage === col.stage;
          const colorClass = STAGE_COLORS[col.stage] ?? "bg-zinc-500/10 border-zinc-400/20 text-zinc-300";

          return (
            <div
              key={col.stage}
              onDragOver={(e) => canEdit && onDragOver(e, col.stage)}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => canEdit && onDrop(e, col.stage)}
              className={`flex w-72 flex-col rounded-[22px] border transition-colors ${
                isOver
                  ? "border-brand-400/50 bg-brand-500/5"
                  : "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)]"
              }`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest ${colorClass}`}>
                  {col.label}
                </span>
                <span className="text-xs text-[color:var(--app-muted)]">{col.candidates.length}</span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 overflow-y-auto px-3 pb-3" style={{ maxHeight: "calc(100vh - 260px)" }}>
                {col.candidates.length === 0 ? (
                  <div className={`flex h-16 items-center justify-center rounded-[14px] border border-dashed text-xs transition-colors ${
                    isOver
                      ? "border-brand-400/50 text-brand-300"
                      : "border-[color:var(--app-border)] text-[color:var(--app-muted)]"
                  }`}>
                    {isOver ? "Drop here" : "No candidates"}
                  </div>
                ) : (
                  col.candidates.map((cand) => (
                    <div
                      key={cand.id}
                      className={`transition-opacity ${
                        draggingId === cand.id ? "opacity-40" : pending.has(cand.id) ? "opacity-60" : "opacity-100"
                      }`}
                    >
                      <CandidateCard
                        candidate={cand}
                        onDragStart={onDragStart}
                        canEdit={canEdit}
                      />
                      {errors[cand.id] ? (
                        <p className="mt-1 px-1 text-xs text-red-400">{errors[cand.id]}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      {draggingId && (
        <div onDragEnd={onDragEnd} className="fixed inset-0 z-0" />
      )}
    </div>
  );
}
