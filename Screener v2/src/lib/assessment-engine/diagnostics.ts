import type {
  Question,
  RoleConfig,
  RoleId,
  StackId
} from "@/lib/assessment-engine/types";
import { getRoleConfig } from "@/lib/data/question-bank";

interface QuotaPlan {
  questionCount: number;
  generalMinimum: number;
  stackMinimum: number;
  seniorOnlyMinimum: number;
  leadOnlyMinimum: number;
  selectedStacks: StackId[];
  stackQuotas: Partial<Record<StackId, number>>;
}

export interface DiagnosticsResult {
  ok: boolean;
  quotaPlan: QuotaPlan;
  errors: string[];
  warnings: string[];
}

export function allowedForRole(q: any, roleId: RoleId, stacks: StackId[]): boolean {
  const order: RoleId[] = ["Intern", "Associate", "SE", "SeniorSE", "TechLead"];
  const current = order.indexOf(roleId);
  const min = order.indexOf(q.roleLevelMin);
  const max = q.roleLevelMax ? order.indexOf(q.roleLevelMax) : Number.POSITIVE_INFINITY;
  if (current < min || current > max) return false;
  if (q.techStack === "General") return true;
  return stacks.includes(q.techStack);
}

function buildQuotaPlan(role: RoleConfig, stacks: StackId[]): QuotaPlan {
  const selectedStacks = stacks.slice();
  const stackQuotas: Partial<Record<StackId, number>> = {};
  const base = selectedStacks.length
    ? Math.floor(role.stack_minimum / selectedStacks.length)
    : 0;
  let rem = selectedStacks.length ? role.stack_minimum % selectedStacks.length : 0;
  selectedStacks.forEach((stack) => {
    stackQuotas[stack] = base;
    if (rem > 0) {
      stackQuotas[stack] = (stackQuotas[stack] || 0) + 1;
      rem -= 1;
    }
  });
  return {
    questionCount: role.question_count,
    generalMinimum: role.general_minimum,
    stackMinimum: role.stack_minimum,
    seniorOnlyMinimum: role.senior_only_minimum,
    leadOnlyMinimum: role.lead_only_minimum,
    selectedStacks,
    stackQuotas
  };
}

export function runDiagnostics(
  roleId: RoleId,
  stacks: StackId[],
  questionBank: Question[]
): DiagnosticsResult {
  const role = getRoleConfig(roleId);
  const errors: string[] = [];
  const warnings: string[] = [];
  const quotaPlan = buildQuotaPlan(role, stacks);
  const eligible = questionBank.filter((q) => allowedForRole(q, roleId, stacks));
  const nonExclusive = eligible.filter((q: any) => !q.seniorOnly && !q.leadOnly);

  if (!stacks.length) errors.push("Select at least one stack.");
  if (eligible.length < role.question_count) {
    errors.push(`Eligible pool shortage: ${eligible.length}/${role.question_count}.`);
  }

  const generalCount = nonExclusive.filter((q) => q.techStack === "General").length;
  if (generalCount < role.general_minimum) {
    errors.push(`General minimum shortage: ${generalCount}/${role.general_minimum}.`);
  }

  const stackCount = nonExclusive.filter((q) => q.techStack !== "General").length;
  if (stackCount < role.stack_minimum) {
    errors.push(`Stack minimum shortage: ${stackCount}/${role.stack_minimum}.`);
  }

  const logCount = eligible.filter((q) => q.format === "log_analysis_single_select").length;
  if (logCount < role.log_analysis_minimum) {
    errors.push(`Log-analysis minimum shortage: ${logCount}/${role.log_analysis_minimum}.`);
  }

  for (const stack of stacks) {
    const available = nonExclusive.filter((q) => q.techStack === stack).length;
    const required = quotaPlan.stackQuotas[stack] || 0;
    if (available < required) {
      errors.push(`Stack quota shortage for ${stack}: ${available}/${required}.`);
    }
  }

  const uniqueFormats = new Set(eligible.map((q) => q.format));
  if (uniqueFormats.size < 5) warnings.push("Low format diversity detected.");
  if (eligible.length === role.question_count) {
    warnings.push("Low variance pool: deterministic retries will likely repeat question IDs.");
  }

  return { ok: errors.length === 0, quotaPlan, errors, warnings };
}
