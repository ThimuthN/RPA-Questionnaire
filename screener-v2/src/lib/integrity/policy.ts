import type { IntegrityPresetId } from "@/lib/assessment-engine/types";

export const integrityPresetIds = ["strict", "standard", "relaxed"] as const satisfies IntegrityPresetId[];

export interface IntegrityPresetMeta {
  id: IntegrityPresetId;
  label: string;
  shortLabel: string;
  description: string;
}

export interface IntegrityPolicy {
  id: IntegrityPresetId;
  label: string;
  shortLabel: string;
  description: string;
  requireFullscreen: boolean;
  blurShieldEnabled: boolean;
  blockClipboard: boolean;
  blockContextMenu: boolean;
  monitorClipboard: boolean;
  monitorTabSwitch: boolean;
}

export const integrityPresetMeta: Record<IntegrityPresetId, IntegrityPresetMeta> = {
  strict: {
    id: "strict",
    label: "Strict Protected Mode",
    shortLabel: "Strict",
    description: "Requires full-screen and actively blocks clipboard and context-menu actions."
  },
  standard: {
    id: "standard",
    label: "Standard Guardrails",
    shortLabel: "Standard",
    description: "Keeps monitoring and copy/paste protection without forcing full-screen."
  },
  relaxed: {
    id: "relaxed",
    label: "Relaxed Monitoring",
    shortLabel: "Relaxed",
    description: "Allows normal browser behavior and keeps lightweight monitoring only."
  }
};

export function normalizeIntegrityPreset(
  value: string | null | undefined,
  fallback: IntegrityPresetId = "strict"
): IntegrityPresetId {
  return integrityPresetIds.includes(value as IntegrityPresetId) ? (value as IntegrityPresetId) : fallback;
}

export function getIntegrityPolicy(preset: string | null | undefined): IntegrityPolicy {
  const normalized = normalizeIntegrityPreset(preset);
  const meta = integrityPresetMeta[normalized];

  if (normalized === "strict") {
    return {
      ...meta,
      requireFullscreen: true,
      blurShieldEnabled: true,
      blockClipboard: true,
      blockContextMenu: true,
      monitorClipboard: true,
      monitorTabSwitch: true
    };
  }

  if (normalized === "standard") {
    return {
      ...meta,
      requireFullscreen: false,
      blurShieldEnabled: true,
      blockClipboard: true,
      blockContextMenu: true,
      monitorClipboard: true,
      monitorTabSwitch: true
    };
  }

  return {
    ...meta,
    requireFullscreen: false,
    blurShieldEnabled: false,
    blockClipboard: false,
    blockContextMenu: false,
    monitorClipboard: true,
    monitorTabSwitch: true
  };
}
