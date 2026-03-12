import type {
  Question,
  RoleId,
  SelectionResult,
  StackId
} from "@/lib/assessment-engine/types";
import { runDiagnostics } from "@/lib/assessment-engine/diagnostics";
import { hashSeed, rng, shuffle } from "@/lib/assessment-engine/utils";
import { configV2, getRoleConfig, questionBank } from "@/lib/data/question-bank";

type FormatCounter = Record<string, number>;
type DifficultyCounter = Record<string, number>;
type StackCounter = Partial<Record<StackId, number>>;

function getCounter(map: Record<string, number>, key: string): number {
  return Number(map[key] || 0);
}

function formatDeficit(question: Question, roleTargets: Record<string, number>, current: FormatCounter): number {
  if (question.format === "single_select" || question.format === "best_next_step") {
    const required = Number(roleTargets.single_or_best_next_step || 0);
    const now = getCounter(current, "single_select") + getCounter(current, "best_next_step");
    return Math.max(0, required - now);
  }
  return Math.max(0, Number(roleTargets[question.format] || 0) - getCounter(current, question.format));
}

function difficultyDeficit(question: Question, target: Record<string, number>, current: DifficultyCounter): number {
  const key = String(question.difficulty);
  return Math.max(0, Number(target[key] || 0) - getCounter(current, key));
}

function rankCandidate(
  question: Question,
  ctx: {
    needLog: boolean;
    roleTargets: Record<string, number>;
    difficultyTargets: Record<string, number>;
    currentFormat: FormatCounter;
    currentDifficulty: DifficultyCounter;
    currentStack: StackCounter;
    requiredStack?: StackId;
    preferGeneral?: boolean;
    stackTargets: StackCounter;
  }
): number {
  let score = 0;
  if (ctx.needLog) score += question.format === "log_analysis_single_select" ? 120 : -20;
  score += formatDeficit(question, ctx.roleTargets, ctx.currentFormat) * 14;
  score += difficultyDeficit(question, ctx.difficultyTargets, ctx.currentDifficulty) * 10;
  if (ctx.requiredStack) score += question.techStack === ctx.requiredStack ? 50 : -50;
  if (ctx.preferGeneral) score += question.techStack === "General" ? 12 : -8;
  if (question.techStack !== "General") {
    const target = Number(ctx.stackTargets[question.techStack] || 0);
    const current = Number(ctx.currentStack[question.techStack] || 0);
    score += Math.max(0, target - current) * 7;
  }
  return score;
}

function allowedForRole(question: Question, roleId: RoleId, stacks: StackId[]): boolean {
  const roleOrder = configV2.canonicalRoleOrder;
  const current = roleOrder.indexOf(roleId);
  const min = roleOrder.indexOf(question.roleLevelMin);
  const max = question.roleLevelMax
    ? roleOrder.indexOf(question.roleLevelMax)
    : Number.POSITIVE_INFINITY;
  if (current < min || current > max) return false;
  if (question.seniorOnly && current < roleOrder.indexOf("SeniorSE")) return false;
  if (question.leadOnly && roleId !== "TechLead") return false;
  if (question.techStack === "General") return true;
  return stacks.includes(question.techStack);
}

function increment(map: Record<string, number>, key: string): void {
  map[key] = Number(map[key] || 0) + 1;
}

export function buildSelection(
  roleId: RoleId,
  stacks: StackId[],
  seed: number,
  providedBank: Question[] = questionBank
): SelectionResult {
  const role = getRoleConfig(roleId);
  const diagnostics = runDiagnostics(roleId, stacks, providedBank);
  if (!diagnostics.ok) {
    throw new Error(diagnostics.errors[0] || "Diagnostics failed.");
  }
  const pool = providedBank
    .filter((q) => allowedForRole(q, roleId, stacks))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (pool.length < role.question_count) {
    throw new Error("Insufficient eligible questions.");
  }

  const seedKey = [roleId, stacks.join("+"), configV2.questionBankVersion, String(seed)].join("|");
  const effectiveSeed = hashSeed(seedKey);
  const random = rng(effectiveSeed);
  const tieIds = pool.map((x) => x.id);
  shuffle(tieIds, random);
  const tieRank = new Map(tieIds.map((id, i) => [id, i]));

  const selected: Question[] = [];
  const used = new Set<string>();
  const currentFormat: FormatCounter = {};
  const currentDifficulty: DifficultyCounter = {};
  const currentStack: StackCounter = {};
  let logCount = 0;
  let generalNonExclusive = 0;

  const stackTargets = diagnostics.quotaPlan.stackQuotas;
  const roleTargets = role.format_targets;
  const difficultyTargets = Object.fromEntries(
    Object.entries(role.difficulty_targets || {}).map(([k, v]) => [String(k), Number(v)])
  );

  function updateState(question: Question): void {
    increment(currentFormat, question.format);
    increment(currentDifficulty, String(question.difficulty));
    if (question.techStack !== "General") {
      currentStack[question.techStack] = Number(currentStack[question.techStack] || 0) + 1;
    }
    if (question.format === "log_analysis_single_select") logCount += 1;
    if (!question.seniorOnly && !question.leadOnly && question.techStack === "General") {
      generalNonExclusive += 1;
    }
  }

  function pick(stage: string, filterFn: (q: Question) => boolean, opts?: { requiredStack?: StackId; preferGeneral?: boolean }): void {
    const candidates = pool.filter((q) => !used.has(q.id) && filterFn(q));
    if (!candidates.length) {
      throw new Error(`Selection stage '${stage}' failed.`);
    }
    let chosen = candidates[0];
    let bestScore = Number.NEGATIVE_INFINITY;
    let bestTie = Number.POSITIVE_INFINITY;
    for (const candidate of candidates) {
      const score = rankCandidate(candidate, {
        needLog: logCount < role.log_analysis_minimum,
        roleTargets,
        difficultyTargets,
        currentFormat,
        currentDifficulty,
        currentStack,
        requiredStack: opts?.requiredStack,
        preferGeneral: opts?.preferGeneral,
        stackTargets
      });
      const tie = Number(tieRank.get(candidate.id) || 99999);
      if (
        score > bestScore ||
        (score === bestScore && tie < bestTie) ||
        (score === bestScore && tie === bestTie && candidate.id < chosen.id)
      ) {
        chosen = candidate;
        bestScore = score;
        bestTie = tie;
      }
    }
    used.add(chosen.id);
    selected.push(chosen);
    updateState(chosen);
  }

  for (const stack of stacks) {
    const quota = Number(stackTargets[stack] || 0);
    for (let i = 0; i < quota; i += 1) {
      pick(`stack_quota_${stack}`, (q) => !q.seniorOnly && !q.leadOnly && q.techStack === stack, {
        requiredStack: stack
      });
    }
  }

  while (logCount < role.log_analysis_minimum) {
    const needGeneral = generalNonExclusive < role.general_minimum;
    if (needGeneral) {
      pick(
        "log_minimum_general",
        (q) =>
          !q.seniorOnly &&
          !q.leadOnly &&
          q.techStack === "General" &&
          q.format === "log_analysis_single_select",
        { preferGeneral: true }
      );
    } else {
      pick(
        "log_minimum_any",
        (q) => !q.seniorOnly && !q.leadOnly && q.format === "log_analysis_single_select"
      );
    }
  }

  while (selected.length < role.question_count) {
    const needGeneral = generalNonExclusive < role.general_minimum;
    if (needGeneral) {
      pick("general_fill", (q) => !q.seniorOnly && !q.leadOnly && q.techStack === "General", {
        preferGeneral: true
      });
    } else {
      pick("nonexclusive_fill", (q) => !q.seniorOnly && !q.leadOnly);
    }
  }

  shuffle(selected, random);
  return {
    selected,
    seed,
    seedKey,
    effectiveSeed,
    selectedIds: selected.map((q) => q.id)
  };
}
