import type { RoleId, StackId } from "@/lib/assessment-engine/types";

export type SectionId = "core" | "practical" | "applied_logic_reasoning";

export interface SectionState {
  answers: Record<string, unknown>;
  remainingSeconds: number;
  earned?: number;
  possible?: number;
}

export interface SectionConfig {
  id: SectionId;
  label: string;
  description: string;
  enabled: boolean;
  defaultSelected: boolean;
  durationMinutes: number;
  order: number;
  weight: number;
  minPercentRequired?: number;
  createInitialState: (opts: { roleId: RoleId; stacks: StackId[] }) => SectionState;
}
