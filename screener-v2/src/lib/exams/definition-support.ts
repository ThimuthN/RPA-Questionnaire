import configRaw from "@/lib/data/config-v2.json";
import type { ConfigV2, RoleId, StackId } from "@/lib/assessment-engine/types";

export const configV2 = configRaw as ConfigV2;

export function resolveCoreBasisRoleId(
  config: Record<string, unknown>,
  fallback: RoleId = configV2.defaultRoleId ?? "Associate"
): RoleId {
  return String(config.coreBasisRoleId || config.roleId || fallback) as RoleId;
}

export function resolveCoreRoleLabel(config: Record<string, unknown>) {
  const basisRoleId = resolveCoreBasisRoleId(config);
  return String(config.roleLabel || configV2.roles[basisRoleId]?.label || basisRoleId);
}

export function ensureStacks(
  value: unknown,
  fallback: StackId[] = [configV2.stacks[0] ?? "UiPath"]
): StackId[] {
  if (!Array.isArray(value)) return fallback;
  const stacks = value.map((item) => String(item) as StackId).filter(Boolean);
  return stacks.length > 0 ? stacks : fallback;
}

export const roleOptions = configV2.canonicalRoleOrder.map((roleId) => ({
  value: roleId,
  label: configV2.roles[roleId].label
}));

export const coreBasisRoleOptions = [...roleOptions];

export const advancedCoreRoleOptions = roleOptions.filter((option) =>
  ["SE", "SeniorSE", "TechLead"].includes(option.value)
);

export const rpaRuntimeLevelOptions = [
  {
    value: "Senior",
    label: "Senior"
  },
  {
    value: "Lead",
    label: "Lead"
  }
] as const;

export const stackOptions = configV2.stacks.map((stackId) => ({
  value: stackId,
  label: configV2.stackLabels[stackId]
}));
