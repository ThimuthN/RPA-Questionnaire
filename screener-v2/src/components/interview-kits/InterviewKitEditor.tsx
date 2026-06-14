"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import type { InterviewKitDetail, InterviewKitCompetency, KitCompetencyAnchor } from "@/lib/interview-kits/types";

function CompetencyCard({
  competency,
  onDelete,
  onUpdate,
}: {
  competency: InterviewKitCompetency;
  onDelete: () => void;
  onUpdate: (data: Partial<InterviewKitCompetency>) => void;
}) {
  const [name, setName] = useState(competency.name);
  const [description, setDescription] = useState(competency.description ?? "");
  const [anchor1, setAnchor1] = useState(competency.anchors["1"] ?? "");
  const [anchor3, setAnchor3] = useState(competency.anchors["3"] ?? "");
  const [anchor5, setAnchor5] = useState(competency.anchors["5"] ?? "");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/interview-kits/${competency.kitId}/competencies/${competency.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          anchors: { "1": anchor1.trim() || undefined, "3": anchor3.trim() || undefined, "5": anchor5.trim() || undefined },
        }),
      });
      onUpdate({ name, description: description || null, anchors: { "1": anchor1 || undefined, "3": anchor3 || undefined, "5": anchor5 || undefined } });
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80";

  return (
    <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4 space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => { if (name !== competency.name) void save(); }}
          placeholder="Competency name"
          className="flex-1 rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm font-medium text-[color:var(--app-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
        />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-[color:var(--app-muted)] hover:text-[color:var(--app-text)] transition"
        >
          {expanded ? "Collapse" : "Anchors"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-[color:var(--app-muted)] hover:text-[color:var(--app-danger)] transition"
          aria-label="Delete competency"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => { if (description !== (competency.description ?? "")) void save(); }}
        placeholder="What this competency covers (optional)"
        className={inputClass}
      />

      {expanded ? (
        <div className="space-y-2 rounded-[14px] bg-[color:var(--app-surface-soft)] p-3">
          <p className="text-xs font-medium text-[color:var(--app-muted)] uppercase tracking-wider">Behavioral anchors</p>
          {[
            { key: "1" as const, label: "1 — Below expectations", value: anchor1, set: setAnchor1 },
            { key: "3" as const, label: "3 — Meets expectations", value: anchor3, set: setAnchor3 },
            { key: "5" as const, label: "5 — Exceeds expectations", value: anchor5, set: setAnchor5 },
          ].map(({ key, label, value, set }) => (
            <label key={key} className="grid gap-1">
              <span className="text-xs text-[color:var(--app-muted)]">{label}</span>
              <input
                type="text"
                value={value}
                onChange={(e) => set(e.target.value)}
                onBlur={() => void save()}
                placeholder="Describe behavior at this level"
                className={inputClass}
              />
            </label>
          ))}
        </div>
      ) : null}

      {saving ? <p className="text-xs text-[color:var(--app-muted)]">Saving…</p> : null}
    </div>
  );
}

export function InterviewKitEditor({ kit: initialKit }: { kit: InterviewKitDetail }) {
  const router = useRouter();
  const [kit, setKit] = useState(initialKit);
  const [title, setTitle] = useState(initialKit.title);
  const [description, setDescription] = useState(initialKit.description ?? "");
  const [savingMeta, setSavingMeta] = useState(false);
  const [addingCompetency, setAddingCompetency] = useState(false);
  const [newCompName, setNewCompName] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function saveMeta() {
    if (title === kit.title && description === (kit.description ?? "")) return;
    setSavingMeta(true);
    try {
      await fetch(`/api/interview-kits/${kit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null }),
      });
      setKit((k) => ({ ...k, title: title.trim(), description: description.trim() || null }));
    } finally {
      setSavingMeta(false);
    }
  }

  async function addCompetency() {
    if (!newCompName.trim()) return;
    try {
      const res = await fetch(`/api/interview-kits/${kit.id}/competencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompName.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { competency?: InterviewKitCompetency };
      if (data.competency) {
        const mapped: InterviewKitCompetency = {
          id: data.competency.id,
          kitId: kit.id,
          name: data.competency.name,
          description: null,
          anchors: {},
          sortOrder: kit.competencies.length,
        };
        setKit((k) => ({ ...k, competencies: [...k.competencies, mapped] }));
        setNewCompName("");
        setAddingCompetency(false);
      }
    } catch {
      // ignore
    }
  }

  async function deleteCompetency(competencyId: string) {
    await fetch(`/api/interview-kits/${kit.id}/competencies/${competencyId}`, { method: "DELETE" });
    setKit((k) => ({ ...k, competencies: k.competencies.filter((c) => c.id !== competencyId) }));
  }

  async function deleteKit() {
    if (!confirm(`Delete "${kit.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/interview-kits/${kit.id}`, { method: "DELETE" });
    router.push("/assessments/kits" as never);
  }

  const inputClass = "w-full rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80";

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Kit metadata */}
      <div className="space-y-4 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-5">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-[color:var(--app-heading)] flex-1">Kit details</h3>
          <StatusPill label={kit.isGlobal ? "Global" : "Department"} tone={kit.isGlobal ? "blue" : "neutral"} />
          {savingMeta ? <span className="text-xs text-[color:var(--app-muted)]">Saving…</span> : null}
        </div>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-[color:var(--app-heading)]">Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => void saveMeta()}
            className={inputClass}
            maxLength={120}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-[color:var(--app-heading)]">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => void saveMeta()}
            rows={2}
            placeholder="What this kit is used for"
            className={inputClass}
          />
        </label>
      </div>

      {/* Competencies */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[color:var(--app-heading)]">
            Competencies ({kit.competencies.length})
          </h3>
          <Button type="button" variant="secondary" onClick={() => setAddingCompetency(true)}>
            <Plus size={14} className="mr-1.5" />
            Add competency
          </Button>
        </div>

        {addingCompetency ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newCompName}
              onChange={(e) => setNewCompName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void addCompetency(); } if (e.key === "Escape") { setAddingCompetency(false); setNewCompName(""); } }}
              placeholder="Competency name, e.g. Problem Solving"
              autoFocus
              className="flex-1 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            />
            <Button type="button" onClick={() => void addCompetency()} disabled={!newCompName.trim()}>Add</Button>
            <Button type="button" variant="ghost" onClick={() => { setAddingCompetency(false); setNewCompName(""); }}>Cancel</Button>
          </div>
        ) : null}

        {kit.competencies.length === 0 && !addingCompetency ? (
          <div className="rounded-[18px] border border-dashed border-[color:var(--app-border)] px-6 py-8 text-center">
            <p className="text-sm text-[color:var(--app-muted)]">No competencies yet. Add the first one above.</p>
          </div>
        ) : null}

        <div className="space-y-3">
          {kit.competencies.map((comp) => (
            <CompetencyCard
              key={comp.id}
              competency={comp}
              onDelete={() => void deleteCompetency(comp.id)}
              onUpdate={(data) =>
                setKit((k) => ({
                  ...k,
                  competencies: k.competencies.map((c) =>
                    c.id === comp.id ? { ...c, ...data, anchors: (data.anchors as KitCompetencyAnchor) ?? c.anchors } : c
                  ),
                }))
              }
            />
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-[18px] border border-red-400/20 bg-red-500/5 p-4 space-y-3">
        <p className="text-sm font-medium text-red-300">Danger zone</p>
        <p className="text-xs text-[color:var(--app-muted)]">Deleting this kit removes it from all job postings it's attached to.</p>
        <Button type="button" variant="secondary" onClick={() => void deleteKit()} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete kit"}
        </Button>
      </div>
    </div>
  );
}
