import type { RoleId } from "@/lib/assessment-engine/types";
import { getRoleConfig } from "@/lib/data/question-bank";

export function getPassThreshold(roleId: RoleId): number {
  return Number(getRoleConfig(roleId).pass_percentage || 60);
}

export function getPracticalMinThreshold(_roleId: RoleId): number {
  return 50;
}

export function confidenceBand(
  finalPercent: number,
  passPercent: number,
  integrity: { tabHiddenCount: number; copyCount: number; pasteCount: number },
  borderline: boolean
): "high" | "medium" | "review" {
  const risk = integrity.tabHiddenCount * 2 + integrity.copyCount + integrity.pasteCount;
  if (borderline || risk >= 6) return "review";
  if (finalPercent >= passPercent + 12 && risk <= 2) return "high";
  return "medium";
}
