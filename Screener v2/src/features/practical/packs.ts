import type { RoleId, StackId } from "@/lib/assessment-engine/types";

export interface PracticalSubtask {
  id: string;
  type: "text" | "ordering" | "single_select";
  label: string;
  points: number;
  expected: unknown;
  items?: string[];
}

export interface PracticalPack {
  id: string;
  roleGroup: "core" | "senior_lead";
  stack: StackId;
  title: string;
  prompt: string;
  subtasks: PracticalSubtask[];
}

const corePrompt =
  "Production automation is failing intermittently. Complete all subtasks with the safest deterministic recovery strategy.";
const seniorPrompt =
  "Automation platform reliability is degrading. Complete all subtasks as the lead making architecture and governance calls.";

function stackSubtasks(stack: StackId): PracticalSubtask[] {
  const stackActionByTool: Record<StackId, string> = {
    UiPath: "Queue retry with idempotent transaction key",
    AutomationAnywhere: "TaskBot checkpoint with vault-backed credentials",
    Python: "Retry wrapper with dedupe key and structured logging",
    PowerAutomate: "Child-flow retry policy with concurrency control"
  };
  return [
    {
      id: "triage_action",
      type: "single_select",
      label: "Best first action",
      points: 2,
      expected: "stabilize_safely"
    },
    {
      id: "flow_order",
      type: "ordering",
      label: "Order the recovery flow",
      points: 3,
      expected: [0, 1, 2, 3],
      items: ["Capture failing item", "Classify failure", "Apply bounded retry", "Write audit log"]
    },
    {
      id: "stack_specific",
      type: "text",
      label: `Enter the stack-specific control for ${stack}`,
      points: 3,
      expected: stackActionByTool[stack]
    },
    {
      id: "governance_gate",
      type: "text",
      label: "Required governance gate",
      points: 2,
      expected: "rollback plan"
    }
  ];
}

const roleGroups: Record<RoleId, "core" | "senior_lead"> = {
  Intern: "core",
  Associate: "core",
  SE: "core",
  SeniorSE: "senior_lead",
  TechLead: "senior_lead"
};

export function roleGroup(roleId: RoleId): "core" | "senior_lead" {
  return roleGroups[roleId];
}

export const practicalPacks: PracticalPack[] = ([
  "UiPath",
  "AutomationAnywhere",
  "Python",
  "PowerAutomate"
] as StackId[]).flatMap((stack) => [
  {
    id: `core_${stack}`,
    roleGroup: "core",
    stack,
    title: `${stack} Execution Rescue`,
    prompt: corePrompt,
    subtasks: stackSubtasks(stack)
  },
  {
    id: `senior_lead_${stack}`,
    roleGroup: "senior_lead",
    stack,
    title: `${stack} Reliability Charter`,
    prompt: seniorPrompt,
    subtasks: stackSubtasks(stack)
  }
]);

export function pickPracticalPack(roleId: RoleId, stacks: StackId[]): PracticalPack {
  const group = roleGroup(roleId);
  const primaryStack = stacks[0] || "UiPath";
  return (
    practicalPacks.find((pack) => pack.roleGroup === group && pack.stack === primaryStack) ||
    practicalPacks[0]
  );
}
