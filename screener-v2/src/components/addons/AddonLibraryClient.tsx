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
  const activeAddonCount = addonOptions.filter((addon) => addon.isActive).length;
  const activePresetCount = presets.filter((preset) => preset.isActive).length;

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

      <StagePanel className="space-y-5 overflow-hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-2">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Add-ons</p>
            <h1 className="text-3xl text-white sm:text-4xl">Shape the library your builders start from.</h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Keep the workspace focused by separating reusable add-on defaults from reusable preset
              mixes. Pick a mode, update one thing at a time, and the builder inherits the cleaner
              starting point.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 self-start rounded-full border border-white/12 bg-black/20 p-1">
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
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[22px] border border-brand-300/20 bg-brand-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-brand-200">Active add-ons</p>
            <p className="mt-2 text-3xl text-white">{activeAddonCount}</p>
            <p className="mt-1 text-sm text-slate-300">{addons.length} entries in the current library.</p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Active presets</p>
            <p className="mt-2 text-3xl text-white">{activePresetCount}</p>
            <p className="mt-1 text-sm text-slate-300">Reusable mixes ready for builders to load.</p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Current focus</p>
            <p className="mt-2 text-lg text-white">
              {viewMode === "addons"
                ? selectedAddon?.label ?? "New add-on draft"
                : selectedPreset?.label ?? "New preset draft"}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {viewMode === "addons"
                ? "Adjust library-owned defaults and engine config."
                : "Bundle add-ons and define mix-specific overrides."}
            </p>
          </div>
        </div>
      </StagePanel>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <StagePanel className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-300">
                {viewMode === "addons" ? "Library browser" : "Preset browser"}
              </p>
              <h2 className="text-2xl text-white">
                {viewMode === "addons" ? "Reusable add-ons" : "Reusable preset mixes"}
              </h2>
              <p className="text-sm text-slate-300">
                {viewMode === "addons"
                  ? "Select an add-on to edit its defaults, or start a fresh entry."
                  : "Select a preset to refine its mix, order, and overrides."}
              </p>
            </div>
            <Button variant="secondary" onClick={viewMode === "addons" ? startNewAddon : startNewPreset}>
              {viewMode === "addons" ? "New add-on" : "New preset"}
            </Button>
          </div>

          {viewMode === "addons" ? (
            <div className="space-y-3">
              {addonOptions.map((addon) => {
                const selected = editingAddonId === addon.id;
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => {
                      setEditingAddonId(addon.id);
                      setAddonForm(addonToForm(addon));
                    }}
                    className={`w-full rounded-[24px] border p-4 text-left transition ${
                      selected
                        ? "border-brand-300/45 bg-brand-500/12 shadow-[0_18px_50px_rgba(18,31,64,0.35)]"
                        : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <StatusPill label={examCatalog[addon.engineType].label} tone={examCatalog[addon.engineType].accentTone} />
                            <StatusPill label={addon.isActive ? "Active" : "Inactive"} tone={addon.isActive ? "emerald" : "neutral"} />
                            {selected ? <StatusPill label="Editing" tone="blue" /> : null}
                          </div>
                          <p className="text-lg text-white">{addon.label}</p>
                        </div>
                        <span className="text-sm text-slate-400">{selected ? "In editor" : "Open"}</span>
                      </div>
                      <p className="text-sm text-slate-300">{addon.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                        <span className="rounded-full border border-white/10 px-3 py-1">
                          {addon.defaultDurationMinutes} min
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1">
                          Min pass {addon.defaultRequiredPercent}%
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1">
                          Default score {addon.defaultWeight}/100
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {presets.map((preset) => {
                const selected = editingPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setEditingPresetId(preset.id);
                      setPresetForm(presetToForm(preset));
                    }}
                    className={`w-full rounded-[24px] border p-4 text-left transition ${
                      selected
                        ? "border-white/20 bg-white/[0.07] shadow-[0_18px_50px_rgba(10,18,34,0.35)]"
                        : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <StatusPill label="Preset" tone="purple" />
                            <StatusPill label={`${preset.items.length} add-ons`} tone="neutral" />
                            <StatusPill
                              label={preset.isActive ? "Active" : "Inactive"}
                              tone={preset.isActive ? "emerald" : "neutral"}
                            />
                            {selected ? <StatusPill label="Editing" tone="blue" /> : null}
                          </div>
                          <p className="text-lg text-white">{preset.label}</p>
                        </div>
                        <span className="text-sm text-slate-400">{selected ? "In editor" : "Open"}</span>
                      </div>
                      <p className="text-sm text-slate-300">{preset.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {preset.items.map((item) => (
                          <StatusPill
                            key={item.id}
                            label={item.addon.label}
                            tone={examCatalog[item.addon.engineType].accentTone}
                            className="normal-case tracking-normal"
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </StagePanel>

        <StagePanel className="space-y-5">
          {viewMode === "addons" ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-300">
                    {editingAddonId ? "Edit add-on" : "Create add-on"}
                  </p>
                  <h2 className="text-2xl text-white">{selectedAddon?.label ?? "Add-on defaults"}</h2>
                  <p className="text-sm text-slate-300">
                    Set the defaults the assessment builder starts from. This is where time, minimum
                    pass, scoring defaults, and engine-specific settings live.
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                  {examCatalog[addonForm.engineType].label}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
                <div className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-5">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Basics</p>
                    <p className="text-sm text-slate-300">Name the add-on and explain when it should be used.</p>
                  </div>
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
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Scoring defaults</p>
                    <p className="text-sm text-slate-300">These become the starting point for presets and new assessments.</p>
                  </div>
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
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Default config</p>
                  <p className="text-sm text-slate-300">
                    Engine-specific defaults live here so the builder only needs to show assessment-specific overrides.
                  </p>
                </div>
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
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-300">
                    {editingPresetId ? "Edit preset" : "Create preset"}
                  </p>
                  <h2 className="text-2xl text-white">{selectedPreset?.label ?? "Preset builder"}</h2>
                  <p className="text-sm text-slate-300">
                    Bundle the right add-ons together, choose the order, and set any mix-specific overrides builders should inherit.
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                  {presetForm.items.length} selected
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div className="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-5">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Basics</p>
                    <p className="text-sm text-slate-300">Give the preset a clear label and a short note for builders.</p>
                  </div>
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
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Included add-ons</p>
                    <p className="text-sm text-slate-300">Choose the library items this preset should load in one step.</p>
                  </div>
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
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Preset composition</p>
                    <p className="text-sm text-slate-300">
                      Refine order and any preset-specific overrides without touching the library defaults.
                    </p>
                  </div>
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
