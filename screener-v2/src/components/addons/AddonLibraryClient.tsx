"use client";

import { useMemo, useState } from "react";
import type {
  AddonCatalogEntry,
  AssessmentPresetEntry
} from "@/lib/addons/catalog";
import type { ExamDefinitionId } from "@/lib/assessment-engine/types";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { StagePanel } from "@/components/scene/StagePanel";
import { ConfigFieldEditor } from "@/components/addons/ConfigFieldEditor";
import { examCatalog, orderedExamCatalog } from "@/lib/exams/catalog";

type AddonFormState = {
  label: string;
  description: string;
  engineType: ExamDefinitionId;
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

function baseAddonForm(engineType: ExamDefinitionId = "core_exam"): AddonFormState {
  const entry = examCatalog[engineType];
  return {
    label: "",
    description: "",
    engineType,
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
    engineType: addon.engineType,
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

export function AddonLibraryClient({
  initialAddons,
  initialPresets
}: {
  initialAddons: AddonCatalogEntry[];
  initialPresets: AssessmentPresetEntry[];
}) {
  const [viewMode, setViewMode] = useState<"addons" | "presets">("addons");
  const [addons, setAddons] = useState(initialAddons);
  const [presets, setPresets] = useState(initialPresets);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [addonForm, setAddonForm] = useState<AddonFormState>(baseAddonForm());
  const [presetForm, setPresetForm] = useState<PresetFormState>(basePresetForm());
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [savingAddon, setSavingAddon] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);

  const addonOptions = useMemo(
    () => addons.slice().sort((left, right) => left.sortOrder - right.sortOrder),
    [addons]
  );

  const addonLookup = useMemo(
    () => new Map(addons.map((addon) => [addon.id, addon])),
    [addons]
  );
  const selectedAddon = editingAddonId ? addonLookup.get(editingAddonId) ?? null : null;
  const selectedPreset = editingPresetId ? presets.find((preset) => preset.id === editingPresetId) ?? null : null;

  async function submitAddon() {
    setSavingAddon(true);
    setMessage(null);

    try {
      const response = await fetch(editingAddonId ? `/api/addons/${editingAddonId}` : "/api/addons", {
        method: editingAddonId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addonForm)
      });
      const data = (await response.json()) as
        | { ok: true; addon: AddonCatalogEntry }
        | { ok: false; message?: string };
      if (!data.ok) {
        throw new Error(data.message || "Could not save add-on.");
      }

      setAddons((current) => {
        const next = editingAddonId
          ? current.map((addon) => (addon.id === data.addon.id ? data.addon : addon))
          : [...current, data.addon];
        return next.slice().sort((left, right) => left.sortOrder - right.sortOrder);
      });
      setEditingAddonId(null);
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
      const response = await fetch(editingPresetId ? `/api/addon-presets/${editingPresetId}` : "/api/addon-presets", {
        method: editingPresetId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as
        | { ok: true; preset: AssessmentPresetEntry }
        | { ok: false; message?: string };
      if (!data.ok) {
        throw new Error(data.message || "Could not save preset.");
      }

      setPresets((current) => {
        const next = editingPresetId
          ? current.map((preset) => (preset.id === data.preset.id ? data.preset : preset))
          : [...current, data.preset];
        return next.slice().sort((left, right) => left.sortOrder - right.sortOrder);
      });
      setEditingPresetId(null);
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

  function setAddonEngine(engineType: ExamDefinitionId) {
    const entry = examCatalog[engineType];
    setAddonForm((current) => ({
      ...current,
      engineType,
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

  function startNewAddon() {
    setViewMode("addons");
    setEditingAddonId(null);
    setAddonForm(baseAddonForm());
  }

  function startNewPreset() {
    setViewMode("presets");
    setEditingPresetId(null);
    setPresetForm(basePresetForm());
  }

  return (
    <div className="space-y-5">
      {message ? (
        <div
          className={
            message.tone === "success"
              ? "rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"
              : "rounded-[20px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100"
          }
        >
          {message.text}
        </div>
      ) : null}

      <StagePanel className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl text-white">{viewMode === "addons" ? "Add-on library" : "Presets"}</h1>
            <p className="text-sm text-slate-300">
              {viewMode === "addons"
                ? "Global defaults used by the assessment builder."
                : "Reusable add-on mixes for faster setup."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2 rounded-full border border-white/12 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => setViewMode("addons")}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  viewMode === "addons"
                    ? "bg-brand-500 text-white shadow-[0_0_24px_rgba(52,124,255,0.35)]"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Add-ons
              </button>
              <button
                type="button"
                onClick={() => setViewMode("presets")}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  viewMode === "presets"
                    ? "bg-white/12 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Presets
              </button>
            </div>
            <Button variant="secondary" onClick={viewMode === "addons" ? startNewAddon : startNewPreset}>
              {viewMode === "addons" ? "New add-on" : "New preset"}
            </Button>
          </div>
        </div>
      </StagePanel>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <StagePanel className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-2xl text-white">
                {viewMode === "addons" ? "All add-ons" : "All presets"}
              </h2>
            </div>
            <StatusPill
              label={viewMode === "addons" ? `${addonOptions.length} add-ons` : `${presets.length} presets`}
              tone="neutral"
            />
          </div>

          {viewMode === "addons" ? (
            <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black/20">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-[0.18em] text-slate-400">
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
                    {addonOptions.map((addon) => {
                      const selected = editingAddonId === addon.id;
                      return (
                        <tr
                          key={addon.id}
                          className={`border-t border-white/10 transition ${
                            selected ? "bg-brand-500/10" : "hover:bg-white/[0.03]"
                          }`}
                        >
                          <td className="px-4 py-3 align-top">
                            <div className="space-y-1">
                              <p className="text-sm text-white">{addon.label}</p>
                              <p className="max-w-[380px] text-xs leading-5 text-slate-400">{addon.description}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <StatusPill label={examCatalog[addon.engineType].label} tone={examCatalog[addon.engineType].accentTone} />
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-slate-200">{addon.defaultDurationMinutes} min</td>
                          <td className="px-4 py-3 align-top text-sm text-slate-200">{addon.defaultRequiredPercent}%</td>
                          <td className="px-4 py-3 align-top text-sm text-slate-200">{addon.defaultWeight}/100</td>
                          <td className="px-4 py-3 align-top text-sm text-slate-200">
                            {addon.isActive ? "Active" : "Inactive"}
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                            <Button
                              type="button"
                              variant={selected ? "secondary" : "ghost"}
                              onClick={() => {
                                setEditingAddonId(addon.id);
                                setAddonForm(addonToForm(addon));
                              }}
                            >
                              {selected ? "Editing" : "Open"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black/20">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-[0.18em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Preset</th>
                      <th className="px-4 py-3 font-medium">Add-ons</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {presets.map((preset) => {
                      const selected = editingPresetId === preset.id;
                      return (
                        <tr
                          key={preset.id}
                          className={`border-t border-white/10 transition ${
                            selected ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                          }`}
                        >
                          <td className="px-4 py-3 align-top">
                            <div className="space-y-1">
                              <p className="text-sm text-white">{preset.label}</p>
                              <p className="max-w-[380px] text-xs leading-5 text-slate-400">{preset.description}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-slate-200">{preset.items.length}</td>
                          <td className="px-4 py-3 align-top text-sm text-slate-200">
                            {preset.isActive ? "Active" : "Inactive"}
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                            <Button
                              type="button"
                              variant={selected ? "secondary" : "ghost"}
                              onClick={() => {
                                setEditingPresetId(preset.id);
                                setPresetForm(presetToForm(preset));
                              }}
                            >
                              {selected ? "Editing" : "Open"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </StagePanel>

        <StagePanel className="space-y-5">
          {viewMode === "addons" ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl text-white">{selectedAddon?.label ?? "New add-on"}</h2>
                  <p className="text-sm text-slate-300">Global settings applied across assessments.</p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                  {examCatalog[addonForm.engineType].label}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
                <div className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-5">
                  <label className="grid gap-2">
                    <span className="text-sm text-slate-200">Label</span>
                    <input
                      value={addonForm.label}
                      onChange={(event) => setAddonForm((current) => ({ ...current, label: event.target.value }))}
                      className="rounded-[16px] border border-white/12 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
                      placeholder="Practical UiPath"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm text-slate-200">Description</span>
                    <textarea
                      rows={4}
                      value={addonForm.description}
                      onChange={(event) =>
                        setAddonForm((current) => ({ ...current, description: event.target.value }))
                      }
                      className="rounded-[16px] border border-white/12 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
                      placeholder="What this add-on is meant to measure."
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm text-slate-200">Engine</span>
                    <select
                      value={addonForm.engineType}
                      onChange={(event) => setAddonEngine(event.target.value as ExamDefinitionId)}
                      className="rounded-[16px] border border-white/12 bg-ink-950 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
                    >
                      {orderedExamCatalog.map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          {exam.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Defaults</p>
                  <div className="grid gap-3">
                    <label className="grid gap-2">
                      <span className="text-sm text-slate-200">Time (minutes)</span>
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
                        className="rounded-[16px] border border-white/12 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm text-slate-200">Minimum pass</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={addonForm.defaultRequiredPercent}
                        onChange={(event) =>
                          setAddonForm((current) => ({
                            ...current,
                            defaultRequiredPercent: Math.min(
                              100,
                              Math.max(0, Math.round(Number(event.target.value) || 0))
                            )
                          }))
                        }
                        className="rounded-[16px] border border-white/12 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm text-slate-200">Default score contribution</span>
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
                        className="rounded-[16px] border border-white/12 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Default config</p>
                {examCatalog[addonForm.engineType].configFields.length > 0 ? (
                  <div className="grid gap-4">
                    {examCatalog[addonForm.engineType].configFields.map((field) => (
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
                  <p className="text-sm text-slate-300">This engine does not need extra default config.</p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-black/20 p-5">
                <label className="flex items-center gap-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={addonForm.isActive}
                    onChange={(event) => setAddonForm((current) => ({ ...current, isActive: event.target.checked }))}
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  Active in the library
                </label>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={submitAddon} disabled={savingAddon}>
                    {savingAddon ? "Saving..." : editingAddonId ? "Save add-on" : "Create add-on"}
                  </Button>
                  {editingAddonId ? (
                    <Button variant="secondary" onClick={startNewAddon}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl text-white">{selectedPreset?.label ?? "New preset"}</h2>
                  <p className="text-sm text-slate-300">A preset is just a reusable add-on mix.</p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                  {presetForm.items.length} selected
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Basics</p>
                  <label className="grid gap-2">
                    <span className="text-sm text-slate-200">Label</span>
                    <input
                      value={presetForm.label}
                      onChange={(event) => setPresetForm((current) => ({ ...current, label: event.target.value }))}
                      className="rounded-[16px] border border-white/12 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
                      placeholder="Graduate screening"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm text-slate-200">Description</span>
                    <textarea
                      rows={4}
                      value={presetForm.description}
                      onChange={(event) =>
                        setPresetForm((current) => ({ ...current, description: event.target.value }))
                      }
                      className="rounded-[16px] border border-white/12 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
                      placeholder="Short note explaining when this preset should be used."
                    />
                  </label>
                </div>

                <div className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Included add-ons</p>
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
                              : "border-white/16 bg-white/[0.05] text-slate-200 hover:border-brand-300/50"
                          }`}
                        >
                          {addon.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Preset composition</p>
                  <label className="flex items-center gap-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={presetForm.isActive}
                      onChange={(event) => setPresetForm((current) => ({ ...current, isActive: event.target.checked }))}
                      className="h-4 w-4 rounded border-white/20 bg-transparent"
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
                        <div key={item.addonId} className="space-y-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                <StatusPill label={`#${index + 1}`} tone="neutral" />
                                <StatusPill label={addon.label} tone={examCatalog[addon.engineType].accentTone} />
                              </div>
                              <p className="text-sm text-slate-300">{addon.description}</p>
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
                            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              Preset score contribution
                            </span>
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
                              className="rounded-[16px] border border-white/12 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
                            />
                          </label>

                          {examCatalog[addon.engineType].configFields.length > 0 ? (
                            <div className="grid gap-4">
                              {examCatalog[addon.engineType].configFields.map((field) => (
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
                  <div className="rounded-[20px] border border-dashed border-white/14 bg-black/15 p-6 text-sm text-slate-300">
                    Select at least one add-on to start building a preset.
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-3 rounded-[24px] border border-white/10 bg-black/20 p-5">
                <Button onClick={submitPreset} disabled={savingPreset}>
                  {savingPreset ? "Saving..." : editingPresetId ? "Save preset" : "Create preset"}
                </Button>
                {editingPresetId ? (
                  <Button variant="secondary" onClick={startNewPreset}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </StagePanel>
      </div>
    </div>
  );
}
