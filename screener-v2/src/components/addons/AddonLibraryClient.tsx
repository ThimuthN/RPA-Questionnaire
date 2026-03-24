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

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <StagePanel className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Add-on library</p>
              <h2 className="text-2xl text-white">Manage reusable exams</h2>
              <p className="text-sm text-slate-300">
                Set the default duration, minimum pass, weight, and engine config here. The
                assessment builder will only override score mix and assessment-specific config.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setEditingAddonId(null);
                setAddonForm(baseAddonForm());
              }}
            >
              New add-on
            </Button>
          </div>

          <div className="space-y-3">
            {addonOptions.map((addon) => (
              <div key={addon.id} className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label={addon.label} tone={examCatalog[addon.engineType].accentTone} />
                      <StatusPill label={addon.isActive ? "Active" : "Inactive"} tone={addon.isActive ? "emerald" : "neutral"} />
                    </div>
                    <p className="text-sm text-slate-300">{addon.description}</p>
                    <p className="text-xs text-slate-400">
                      {addon.defaultDurationMinutes} min | Min pass {addon.defaultRequiredPercent}% |
                      Default score {addon.defaultWeight}/100
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingAddonId(addon.id);
                      setAddonForm(addonToForm(addon));
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </StagePanel>

        <StagePanel className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-300">
              {editingAddonId ? "Edit add-on" : "Create add-on"}
            </p>
            <h2 className="text-2xl text-white">Add-on defaults</h2>
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
              rows={3}
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

          <div className="grid gap-3 md:grid-cols-3">
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
              <span className="text-sm text-slate-200">Default score</span>
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

          <div className="space-y-4 rounded-[20px] border border-white/10 bg-black/20 p-4">
            <div className="space-y-1">
              <p className="text-sm text-white">Default config</p>
              <p className="text-xs text-slate-400">
                These settings are owned by the add-on library and become the starting point for
                presets and assessments.
              </p>
            </div>
            {examCatalog[addonForm.engineType].configFields.length > 0 ? (
              examCatalog[addonForm.engineType].configFields.map((field) => (
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
              ))
            ) : (
              <p className="text-sm text-slate-300">This engine does not need extra default config.</p>
            )}
          </div>

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
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingAddonId(null);
                  setAddonForm(baseAddonForm());
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </StagePanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <StagePanel className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-300">Presets</p>
              <h2 className="text-2xl text-white">Bundle add-ons into reusable mixes</h2>
              <p className="text-sm text-slate-300">
                Presets preselect the add-ons, order, config overrides, and optional scoring defaults
                that the assessment builder can load in one step.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setEditingPresetId(null);
                setPresetForm(basePresetForm());
              }}
            >
              New preset
            </Button>
          </div>

          <div className="space-y-3">
            {presets.map((preset) => (
              <div key={preset.id} className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <StatusPill label={preset.label} tone="purple" />
                      <StatusPill label={preset.isActive ? "Active" : "Inactive"} tone={preset.isActive ? "emerald" : "neutral"} />
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
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditingPresetId(preset.id);
                      setPresetForm(presetToForm(preset));
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </StagePanel>

        <StagePanel className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.22em] text-brand-300">
              {editingPresetId ? "Edit preset" : "Create preset"}
            </p>
            <h2 className="text-2xl text-white">Preset builder</h2>
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
              rows={3}
              value={presetForm.description}
              onChange={(event) =>
                setPresetForm((current) => ({ ...current, description: event.target.value }))
              }
              className="rounded-[16px] border border-white/12 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-brand-300/60"
              placeholder="Short note explaining when this preset should be used."
            />
          </label>

          <label className="flex items-center gap-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={presetForm.isActive}
              onChange={(event) => setPresetForm((current) => ({ ...current, isActive: event.target.checked }))}
              className="h-4 w-4 rounded border-white/20 bg-transparent"
            />
            Active in the builder
          </label>

          <div className="space-y-3 rounded-[20px] border border-white/10 bg-black/20 p-4">
            <div className="space-y-1">
              <p className="text-sm text-white">Included add-ons</p>
              <p className="text-xs text-slate-400">Select the library items this preset should load.</p>
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

          {presetForm.items.length > 0 ? (
            <div className="space-y-3">
              {presetForm.items.map((item, index) => {
                const addon = addonLookup.get(item.addonId);
                if (!addon) return null;

                return (
                  <div key={item.addonId} className="space-y-4 rounded-[20px] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
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
                      <div className="space-y-4">
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
            <p className="text-sm text-slate-300">Select at least one add-on to build a preset.</p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={submitPreset} disabled={savingPreset}>
              {savingPreset ? "Saving..." : editingPresetId ? "Save preset" : "Create preset"}
            </Button>
            {editingPresetId ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingPresetId(null);
                  setPresetForm(basePresetForm());
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </StagePanel>
      </div>
    </div>
  );
}
