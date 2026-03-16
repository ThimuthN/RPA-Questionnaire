import type { RoleId, StackId } from "@/lib/assessment-engine/types";
import type { SectionConfig, SectionId, SectionState } from "@/lib/sections/types";
import { getRoleConfig } from "@/lib/data/question-bank";

export const sectionRegistry: Record<SectionId, SectionConfig> = {
  core: {
    id: "core",
    label: "Core",
    description: "Core multiple-choice questions that test foundational knowledge.",
    enabled: true,
    defaultSelected: true,
    durationMinutes: 20,
    order: 0,
    weight: 70,
    createInitialState: (opts) => {
      const roleConfig = getRoleConfig(opts.roleId);
      return {
        answers: {},
        remainingSeconds: (roleConfig?.time_limit_minutes ?? 20) * 60
      };
    }
  },
  practical: {
    id: "practical",
    label: "Practical",
    description: "Practical task section that evaluates hands-on skills.",
    enabled: true,
    defaultSelected: true,
    durationMinutes: 10,
    order: 1,
    weight: 30,
    minPercentRequired: 50,
    createInitialState: (_opts) => ({
      answers: {},
      remainingSeconds: 10 * 60
    })
  },
  applied_logic_reasoning: {
    id: "applied_logic_reasoning",
    label: "Applied Logic & Reasoning",
    description: "A short reasoning section with logic puzzles.",
    enabled: true,
    defaultSelected: false,
    durationMinutes: 10,
    order: 2,
    weight: 20,
    createInitialState: (_opts) => ({
      answers: {},
      remainingSeconds: 10 * 60
    })
  }
};

export const orderedSections = Object.values(sectionRegistry).sort((a, b) => a.order - b.order);

export function getDefaultSelectedSections(): SectionId[] {
  return orderedSections.filter((section) => section.enabled && section.defaultSelected).map((section) => section.id);
}

export function normalizeSelectedSections(selected?: SectionId[]): SectionId[] {
  const picked = new Set(selected ?? []);
  const normalized = orderedSections
    .filter((section) => section.enabled && picked.has(section.id))
    .map((section) => section.id);

  if (normalized.length > 0) {
    return normalized;
  }

  const defaults = getDefaultSelectedSections();
  return defaults.length > 0 ? defaults : orderedSections.filter((section) => section.enabled).map((section) => section.id);
}

export function getSectionDurationMinutes(sectionId: SectionId, roleId: RoleId): number {
  if (sectionId === "core") {
    return getRoleConfig(roleId).time_limit_minutes;
  }
  return sectionRegistry[sectionId].durationMinutes;
}

export function getTotalDurationMinutes(sections: SectionId[], roleId: RoleId): number {
  return normalizeSelectedSections(sections).reduce((sum, sectionId) => sum + getSectionDurationMinutes(sectionId, roleId), 0);
}

export function createSectionState(args: {
  roleId: RoleId;
  stacks: StackId[];
  sections: SectionId[];
}): Partial<Record<SectionId, SectionState>> {
  const normalized = normalizeSelectedSections(args.sections);
  const sectionState: Partial<Record<SectionId, SectionState>> = {};

  for (const sectionId of normalized) {
    sectionState[sectionId] = sectionRegistry[sectionId].createInitialState({
      roleId: args.roleId,
      stacks: args.stacks
    });
  }

  return sectionState;
}
