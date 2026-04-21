"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type {
  AddonCatalogEntry,
  AssessmentPresetEntry
} from "@/lib/addons/catalog";
import type { ExamDefinitionId } from "@/lib/assessment-engine/types";
import { Button } from "@/components/primitives/Button";
import { StaggerGroup, StaggerItem } from "@/components/motion/StaggerGroup";
import { StatusPill } from "@/components/primitives/StatusPill";
import { StagePanel } from "@/components/scene/StagePanel";
import { ConfigFieldEditor } from "@/components/addons/ConfigFieldEditor";
import {
  getAddonAssessmentType,
  getAddonAssessmentTypeMeta,
  orderedAddonAssessmentTypes
} from "@/lib/addons/assessment-types";
import {
  buildRequestErrorMessage,
  fetchJsonWithTimeout
} from "@/lib/http/client";

type AddonFormState = {
  label: string;
  description: string;
  assessmentTypeId: ExamDefinitionId;
  defaultDurationMinutes: number;
  defaultRequiredPercent: number;
  defaultWeight: number;
  isActive: boolean;
  defaultConfig: Record<string, unknown>;
};

type PresetItemForm = {
  addonId: string;
  sortOrder: number;
  configOverride: Record<string, unknown>;
  weightOverride: string;
};

type PresetFormState = {
  label: string;
  description: string;
  isActive: boolean;
  items: PresetItemForm[];
};

function baseAddonForm(assessmentTypeId: ExamDefinitionId = "core_exam"): AddonFormState {
  const entry = getAddonAssessmentType(assessmentTypeId);
  if (!entry) {
    throw new Error(`Unknown assessment type: ${assessmentTypeId}`);
  }
  return {
    label: "",
    description: "",
    assessmentTypeId,
    defaultDurationMinutes: entry.buildDurationMinutes(entry.defaultConfig),
    defaultRequiredPercent: entry.buildRequiredPercent(entry.defaultConfig, 60),
    defaultWeight: entry.defaultWeight,
    isActive: true,
    defaultConfig: structuredClone(entry.defaultConfig)
  };
}

function basePresetForm(): PresetFormState {
  return {
    label: "",
    description: "",
    isActive: true,
    items: []
  };
}

function presetItemFromAddon(addon: AddonCatalogEntry, sortOrder: number): PresetItemForm {
  return {
    addonId: addon.id,
    sortOrder,
    configOverride: {},
    weightOverride: ""
  };
}

function addonToForm(addon: AddonCatalogEntry): AddonFormState {
  return {
    label: addon.label,
    description: addon.description,
    assessmentTypeId: addon.assessmentTypeId,
    defaultDurationMinutes: addon.defaultDurationMinutes,
    defaultRequiredPercent: addon.defaultRequiredPercent,
    defaultWeight: addon.defaultWeight,
    isActive: addon.isActive,
    defaultConfig: structuredClone(addon.defaultConfig)
  };
}

function presetToForm(preset: AssessmentPresetEntry): PresetFormState {
  return {
    label: preset.label,
    description: preset.description,
    isActive: preset.isActive,
    items: preset.items.map((item) => ({
      addonId: item.addonId,
      sortOrder: item.sortOrder,
      configOverride: structuredClone(item.configOverride),
      weightOverride: typeof item.weightOverride === "number" ? String(item.weightOverride) : ""
    }))
  };
}

function compactText(value: string, maxLength = 88) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}...`;
}

export function AddonLibraryClient({
  initialAddons,
  initialPresets
}: {
  initialAddons: AddonCatalogEntry[];
  initialPresets: AssessmentPresetEntry[];
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [viewMode, setViewMode] = useState<"addons" | "presets">("addons");
  const [showInactive, setShowInactive] = useState(false);
  const [addons, setAddons] = useState(initialAddons);
  const [presets, setPresets] = useState(initialPresets);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [addonForm, setAddonForm] = useState<AddonFormState>(baseAddonForm());
  const [presetForm, setPresetForm] = useState<PresetFormState>(basePresetForm());
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [savingAddon, setSavingAddon] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);

  const addonOptions = useMemo(
    () =>
      addons
        .filter((addon) => showInactive || addon.isActive)
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [addons, showInactive]
  );

  const presetOptions = useMemo(
    () =>
      presets
        .filter((preset) => showInactive || preset.isActive)
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [presets, showInactive]
  );

  const addonLookup = useMemo(
    () => new Map(addons.map((addon) => [addon.id, addon])),
    [addons]
  );
  const selectedAddon = editingAddonId ? addonLookup.get(editingAddonId) ?? null : null;
  const selectedPreset = editingPresetId ? presets.find((preset) => preset.id === editingPresetId) ?? null : null;
  const selectedAddonEntry = getAddonAssessmentType(addonForm.assessmentTypeId);
  const selectedAddonType = getAddonAssessmentTypeMeta(addonForm.assessmentTypeId);
  const editingUnknownAddonType = addonModalOpen && !selectedAddonEntry;

  async function submitAddon() {
    setSavingAddon(true);
    setMessage(null);

    try {
      const { response, data } = await fetchJsonWithTimeout<
        | { ok: true; addon: AddonCatalogEntry }
        | { ok: false; message?: string; requestId?: string }
      >(editingAddonId ? `/api/addons/${editingAddonId}` : "/api/addons", {
        method: editingAddonId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addonForm)
      });
      if (!response.ok || !data?.ok) {
        throw new Error(buildRequestErrorMessage(data, "Could not save add-on."));
      }

      setAddons((current) => {
        const next = editingAddonId
          ? current.map((addon) => (addon.id === data.addon.id ? data.addon : addon))
          : [...current, data.addon];
        return next.slice().sort((left, right) => left.sortOrder - right.sortOrder);
      });
      setEditingAddonId(null);
      setAddonModalOpen(false);
      setAddonForm(baseAddonForm());
      setMessage({
        tone: "success",
        text: editingAddonId ? "Add-on updated." : "Add-on created."
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not save add-on."
      });
    } finally {
      setSavingAddon(false);
    }
  }

  async function submitPreset() {
    setSavingPreset(true);
    setMessage(null);

    try {
      const payload = {
        label: presetForm.label,
        description: presetForm.description,
        isActive: presetForm.isActive,
        items: presetForm.items.map((item, index) => ({
          addonId: item.addonId,
          sortOrder: index,
          configOverride: item.configOverride,
          weightOverride: item.weightOverride.trim() ? Number(item.weightOverride) : undefined
        }))
      };
      const { response, data } = await fetchJsonWithTimeout<
        | { ok: true; preset: AssessmentPresetEntry }
        | { ok: false; message?: string; requestId?: string }
      >(editingPresetId ? `/api/addon-presets/${editingPresetId}` : "/api/addon-presets", {
        method: editingPresetId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok || !data?.ok) {
        throw new Error(buildRequestErrorMessage(data, "Could not save preset."));
      }

      setPresets((current) => {
        const next = editingPresetId
          ? current.map((preset) => (preset.id === data.preset.id ? data.preset : preset))
          : [...current, data.preset];
        return next.slice().sort((left, right) => left.sortOrder - right.sortOrder);
      });
      setEditingPresetId(null);
      setPresetModalOpen(false);
      setPresetForm(basePresetForm());
      setMessage({
        tone: "success",
        text: editingPresetId ? "Preset updated." : "Preset created."
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not save preset."
      });
    } finally {
      setSavingPreset(false);
    }
  }

  function setAddonAssessmentType(assessmentTypeId: ExamDefinitionId) {
    const entry = getAddonAssessmentType(assessmentTypeId);
    if (!entry) {
      return;
    }
    setAddonForm((current) => ({
      ...current,
      assessmentTypeId,
      defaultDurationMinutes: entry.buildDurationMinutes(entry.defaultConfig),
      defaultRequiredPercent: entry.buildRequiredPercent(entry.defaultConfig, 60),
      defaultWeight: entry.defaultWeight,
      defaultConfig: structuredClone(entry.defaultConfig)
    }));
  }

  function togglePresetAddon(addon: AddonCatalogEntry) {
    setPresetForm((current) => {
      const existing = current.items.find((item) => item.addonId === addon.id);
      if (existing) {
        return {
          ...current,
          items: current.items
            .filter((item) => item.addonId !== addon.id)
            .map((item, index) => ({ ...item, sortOrder: index }))
        };
      }

      return {
        ...current,
        items: [...current.items, presetItemFromAddon(addon, current.items.length)]
      };
    });
  }

  function startNewPreset() {
    setViewMode("presets");
    setEditingPresetId(null);
    setPresetForm(basePresetForm());
    setPresetModalOpen(true);
  }

  function openAddonEditor(addon: AddonCatalogEntry) {
    setEditingAddonId(addon.id);
    setAddonForm(addonToForm(addon));
    setAddonModalOpen(true);
  }

  function closeAddonEditor() {
    setAddonModalOpen(false);
    setEditingAddonId(null);
    setAddonForm(baseAddonForm());
  }

  function openPresetEditor(preset: AssessmentPresetEntry) {
    setEditingPresetId(preset.id);
    setPresetForm(presetToForm(preset));
    setPresetModalOpen(true);
  }

  function closePresetEditor() {
    setPresetModalOpen(false);
    setEditingPresetId(null);
    setPresetForm(basePresetForm());
  }

  return (
    <StaggerGroup className="space-y-5" delay={0.04}>
      {message ? (
        <StaggerItem>
          <div
            className={
              message.tone === "success"
                ? "rounded-[20px] border border-[color:var(--app-success)]/30 bg-[color:var(--app-success-soft)] p-4 text-sm text-[color:var(--app-success)]"
                : "rounded-[20px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] p-4 text-sm text-[color:var(--app-danger)]"
            }
          >
            {message.text}
          </div>
        </StaggerItem>
      ) : null}

      <StaggerItem>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-1 shadow-[var(--app-shadow-soft)]">
              <button
                type="button"
                onClick={() => setViewMode("addons")}
                aria-pressed={viewMode === "addons"}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  viewMode === "addons"
                    ? "bg-brand-500 text-white shadow-[0_0_24px_rgba(52,124,255,0.35)]"
                    : "text-[color:var(--app-muted)] hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)]"
                }`}
              >
                Add-ons
              </button>
              <button
                type="button"
                onClick={() => setViewMode("presets")}
                aria-pressed={viewMode === "presets"}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  viewMode === "presets"
                    ? "bg-purple-500/22 text-white shadow-[0_0_24px_rgba(148,93,255,0.28)]"
                    : "text-[color:var(--app-muted)] hover:bg-[color:var(--app-surface-soft)] hover:text-[color:var(--app-heading)]"
                }`}
              >
                Presets
              </button>
            </div>
          </div>
        </div>
      </StaggerItem>

      <StaggerItem>
        <StagePanel tone="open" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-2xl text-[color:var(--app-heading)]">{viewMode === "addons" ? "All add-ons" : "All presets"}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill
              label={viewMode === "addons" ? `${addonOptions.length} add-ons` : `${presetOptions.length} presets`}
              tone="neutral"
            />
            <label className="flex items-center gap-2 text-sm text-[color:var(--app-muted)]">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => setShowInactive(event.target.checked)}
                className="h-4 w-4 rounded border-[color:var(--app-border)] bg-transparent"
              />
              Show inactive
            </label>
            {viewMode === "presets" ? (
              <Button type="button" onClick={startNewPreset}>
                New preset
              </Button>
            ) : null}
          </div>
        </div>

        {viewMode === "addons" ? (
          <div className="overflow-hidden rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-table-head)] text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Add-on</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Pass</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {addonOptions.map((addon) => (
                    <tr key={addon.id} className="border-t border-[color:var(--app-border)] transition hover:bg-[color:var(--app-table-row-hover)]">
                      <td className="px-4 py-3 align-top">
                        <div className="space-y-1">
                          <p className="text-sm text-[color:var(--app-heading)]">{addon.label}</p>
                          <p className="max-w-[440px] text-xs leading-5 text-[color:var(--app-muted)]">{compactText(addon.description, 72)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <StatusPill label={getAddonAssessmentTypeMeta(addon.assessmentTypeId).label} tone={getAddonAssessmentTypeMeta(addon.assessmentTypeId).tone} />
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-[color:var(--app-text)]">{addon.defaultDurationMinutes} min</td>
                      <td className="px-4 py-3 align-top text-sm text-[color:var(--app-text)]">{addon.defaultRequiredPercent}%</td>
                      <td className="px-4 py-3 align-top text-sm text-[color:var(--app-text)]">{addon.defaultWeight}/100</td>
                      <td className="px-4 py-3 align-top text-sm text-[color:var(--app-text)]">{addon.isActive ? "Active" : "Inactive"}</td>
                      <td className="px-4 py-3 text-right align-top">
                        <Button type="button" variant="ghost" onClick={() => openAddonEditor(addon)}>
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[22px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-table-head)] text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Preset</th>
                    <th className="px-4 py-3 font-medium">Add-ons</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {presetOptions.map((preset) => (
                    <tr key={preset.id} className="border-t border-[color:var(--app-border)] transition hover:bg-[color:var(--app-table-row-hover)]">
                      <td className="px-4 py-3 align-top">
                        <div className="space-y-1">
                          <p className="text-sm text-[color:var(--app-heading)]">{preset.label}</p>
                          <p className="max-w-[440px] text-xs leading-5 text-[color:var(--app-muted)]">{compactText(preset.description, 72)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-[color:var(--app-text)]">{preset.items.length}</td>
                      <td className="px-4 py-3 align-top text-sm text-[color:var(--app-text)]">{preset.isActive ? "Active" : "Inactive"}</td>
                      <td className="px-4 py-3 text-right align-top">
                        <Button type="button" variant="ghost" onClick={() => openPresetEditor(preset)}>
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </StagePanel>
      </StaggerItem>

      <AnimatePresence>
      {addonModalOpen ? (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, backdropFilter: "blur(6px)" }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "var(--app-modal-overlay)" }}
        >
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.985, filter: "blur(10px)" }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.992, filter: "blur(8px)" }}
            transition={{ duration: reduceMotion ? 0.14 : 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-[color:var(--app-border)] p-6"
            style={{
              background: "var(--app-modal-surface)",
              boxShadow: "var(--app-modal-shadow)"
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl text-[color:var(--app-heading)]">{selectedAddon?.label ?? "New add-on"}</h2>
                <p className="text-sm text-[color:var(--app-muted)]">Global settings used across assessments.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill label={selectedAddonType.label} tone={selectedAddonType.tone} />
                {editingAddonId && !editingUnknownAddonType ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push(`/addons/${editingAddonId}/review`)}
                  >
                    Review
                  </Button>
                ) : null}
                <Button type="button" variant="secondary" onClick={closeAddonEditor}>
                  Close
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
              <div className="space-y-4 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-modal-body)] p-5">
                <label className="grid gap-2">
                  <span className="text-sm text-[color:var(--app-text)]">Label</span>
                  <input
                    value={addonForm.label}
                    onChange={(event) => setAddonForm((current) => ({ ...current, label: event.target.value }))}
                    className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60"
                    placeholder="Practical UiPath"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm text-[color:var(--app-text)]">Description</span>
                  <textarea
                    rows={4}
                    value={addonForm.description}
                    onChange={(event) =>
                      setAddonForm((current) => ({ ...current, description: event.target.value }))
                    }
                    className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60"
                    placeholder="What this add-on is meant to measure."
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm text-[color:var(--app-text)]">Assessment type</span>
                  <select
                    value={addonForm.assessmentTypeId}
                    onChange={(event) => setAddonAssessmentType(event.target.value as ExamDefinitionId)}
                    className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60"
                  >
                    {orderedAddonAssessmentTypes.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.label}
                      </option>
                    ))}
                  </select>
                  {selectedAddonType.description ? (
                    <p className="text-xs text-[color:var(--app-muted)]">{selectedAddonType.description}</p>
                  ) : null}
                </label>
              </div>

              <div className="space-y-4 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-modal-body)] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Defaults</p>
                <div className="grid gap-3">
                  <label className="grid gap-2">
                    <span className="text-sm text-[color:var(--app-text)]">Time (minutes)</span>
                    <input
                      type="number"
                      min={1}
                      value={addonForm.defaultDurationMinutes}
                      onChange={(event) =>
                        setAddonForm((current) => ({
                          ...current,
                          defaultDurationMinutes: Math.max(1, Math.round(Number(event.target.value) || 1))
                        }))
                      }
                      className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm text-[color:var(--app-text)]">Minimum pass</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={addonForm.defaultRequiredPercent}
                      onChange={(event) =>
                        setAddonForm((current) => ({
                          ...current,
                          defaultRequiredPercent: Math.min(100, Math.max(0, Math.round(Number(event.target.value) || 0)))
                        }))
                      }
                      className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm text-[color:var(--app-text)]">Default score contribution</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={addonForm.defaultWeight}
                      onChange={(event) =>
                        setAddonForm((current) => ({
                          ...current,
                          defaultWeight: Math.min(100, Math.max(0, Math.round(Number(event.target.value) || 0)))
                        }))
                      }
                      className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-4 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-modal-body)] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Default config</p>
              {editingUnknownAddonType ? (
                <div className="rounded-[18px] border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] p-4 text-sm text-[color:var(--app-danger)]">
                  This add-on references an assessment type that this app build does not recognize:
                  {" "}
                  <span className="font-mono">{addonForm.assessmentTypeId}</span>
                  . Refresh or redeploy the app before editing and saving it.
                </div>
              ) : selectedAddonType.configFields.length > 0 ? (
                <div className="grid gap-4">
                  {selectedAddonType.configFields.map((field) => (
                    <ConfigFieldEditor
                      key={field.key}
                      field={field}
                      value={addonForm.defaultConfig[field.key]}
                      onChange={(next) =>
                        setAddonForm((current) => ({
                          ...current,
                          defaultConfig: { ...current.defaultConfig, [field.key]: next }
                        }))
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[color:var(--app-muted)]">This assessment type does not need extra default config.</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-modal-footer)] p-5">
              <label className="flex items-center gap-3 text-sm text-[color:var(--app-text)]">
                <input
                  type="checkbox"
                  checked={addonForm.isActive}
                  onChange={(event) => setAddonForm((current) => ({ ...current, isActive: event.target.checked }))}
                  className="h-4 w-4 rounded border-[color:var(--app-border)] bg-transparent"
                />
                Active in the library
              </label>
              <div className="flex flex-wrap gap-3">
                {editingAddonId && !editingUnknownAddonType ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push(`/addons/${editingAddonId}/review`)}
                  >
                    Review
                  </Button>
                ) : null}
                <Button onClick={submitAddon} disabled={savingAddon || editingUnknownAddonType}>
                  {savingAddon ? "Saving..." : editingAddonId ? "Save add-on" : "Create add-on"}
                </Button>
                <Button type="button" variant="secondary" onClick={closeAddonEditor}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
      </AnimatePresence>

      <AnimatePresence>
      {presetModalOpen ? (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, backdropFilter: "blur(6px)" }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "var(--app-modal-overlay)" }}
        >
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.985, filter: "blur(10px)" }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.992, filter: "blur(8px)" }}
            transition={{ duration: reduceMotion ? 0.14 : 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-[color:var(--app-border)] p-6"
            style={{
              background: "var(--app-modal-surface)",
              boxShadow: "var(--app-modal-shadow)"
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl text-[color:var(--app-heading)]">{selectedPreset?.label ?? "New preset"}</h2>
                <p className="text-sm text-[color:var(--app-muted)]">Reusable add-on set.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill label={`${presetForm.items.length} add-ons`} tone="neutral" />
                <Button type="button" variant="secondary" onClick={closePresetEditor}>
                  Close
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-4 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-modal-body)] p-5">
                <label className="grid gap-2">
                  <span className="text-sm text-[color:var(--app-text)]">Label</span>
                  <input
                    value={presetForm.label}
                    onChange={(event) => setPresetForm((current) => ({ ...current, label: event.target.value }))}
                    className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60"
                    placeholder="Graduate screening"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm text-[color:var(--app-text)]">Description</span>
                  <textarea
                    rows={4}
                    value={presetForm.description}
                    onChange={(event) =>
                      setPresetForm((current) => ({ ...current, description: event.target.value }))
                    }
                    className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60"
                    placeholder="Short note explaining when this preset should be used."
                  />
                </label>
              </div>

              <div className="space-y-4 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-modal-body)] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Included add-ons</p>
                <div className="flex flex-wrap gap-2">
                  {addonOptions.filter((addon) => addon.isActive).map((addon) => {
                    const active = presetForm.items.some((item) => item.addonId === addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => togglePresetAddon(addon)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          active
                            ? "border-brand-300 bg-brand-500/18 text-white"
                            : "border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[color:var(--app-text)] hover:border-brand-300/50"
                        }`}
                      >
                        {addon.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-4 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-modal-body)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Preset composition</p>
                <label className="flex items-center gap-3 text-sm text-[color:var(--app-text)]">
                  <input
                    type="checkbox"
                    checked={presetForm.isActive}
                    onChange={(event) => setPresetForm((current) => ({ ...current, isActive: event.target.checked }))}
                    className="h-4 w-4 rounded border-[color:var(--app-border)] bg-transparent"
                  />
                  Active in the builder
                </label>
              </div>

              {presetForm.items.length > 0 ? (
                <div className="space-y-3">
                  {presetForm.items.map((item, index) => {
                    const addon = addonLookup.get(item.addonId);
                    if (!addon) return null;

                    return (
                      <div key={item.addonId} className="space-y-4 rounded-[20px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <StatusPill label={`#${index + 1}`} tone="neutral" />
                              <StatusPill label={addon.label} tone={getAddonAssessmentTypeMeta(addon.assessmentTypeId).tone} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              disabled={index === 0}
                              onClick={() =>
                                setPresetForm((current) => {
                                  const next = current.items.slice();
                                  const [entry] = next.splice(index, 1);
                                  next.splice(index - 1, 0, entry);
                                  return {
                                    ...current,
                                    items: next.map((currentItem, itemIndex) => ({
                                      ...currentItem,
                                      sortOrder: itemIndex
                                    }))
                                  };
                                })
                              }
                            >
                              Up
                            </Button>
                            <Button
                              variant="ghost"
                              disabled={index === presetForm.items.length - 1}
                              onClick={() =>
                                setPresetForm((current) => {
                                  const next = current.items.slice();
                                  const [entry] = next.splice(index, 1);
                                  next.splice(index + 1, 0, entry);
                                  return {
                                    ...current,
                                    items: next.map((currentItem, itemIndex) => ({
                                      ...currentItem,
                                      sortOrder: itemIndex
                                    }))
                                  };
                                })
                              }
                            >
                              Down
                            </Button>
                          </div>
                        </div>

                        <label className="grid gap-2">
                          <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Preset score contribution</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.weightOverride}
                            onChange={(event) =>
                              setPresetForm((current) => ({
                                ...current,
                                items: current.items.map((currentItem) =>
                                  currentItem.addonId === item.addonId
                                    ? { ...currentItem, weightOverride: event.target.value }
                                    : currentItem
                                )
                              }))
                            }
                            placeholder={`${addon.defaultWeight}`}
                            className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60"
                          />
                        </label>

                        {getAddonAssessmentTypeMeta(addon.assessmentTypeId).configFields.length > 0 ? (
                          <div className="grid gap-4">
                            {getAddonAssessmentTypeMeta(addon.assessmentTypeId).configFields.map((field) => (
                              <ConfigFieldEditor
                                key={`${item.addonId}-${field.key}`}
                                field={field}
                                value={item.configOverride[field.key] ?? addon.defaultConfig[field.key]}
                                onChange={(next) =>
                                  setPresetForm((current) => ({
                                    ...current,
                                    items: current.items.map((currentItem) =>
                                      currentItem.addonId === item.addonId
                                        ? {
                                            ...currentItem,
                                            configOverride: { ...currentItem.configOverride, [field.key]: next }
                                          }
                                        : currentItem
                                    )
                                  }))
                                }
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[20px] border border-dashed border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-6 text-sm text-[color:var(--app-muted)]">
                  Select at least one add-on.
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-3 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-modal-footer)] p-5">
              <Button onClick={submitPreset} disabled={savingPreset}>
                {savingPreset ? "Saving..." : editingPresetId ? "Save preset" : "Create preset"}
              </Button>
              <Button type="button" variant="secondary" onClick={closePresetEditor}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </StaggerGroup>
  );
}
