import configRaw from "@/lib/data/config-v2.json";
import rawBank from "@/lib/data/question-bank.json";
import type {
  ConfigV2,
  PromptBlock,
  Question,
  QuestionFormatId,
  RoleId,
  ScoringMethod,
  StackId
} from "@/lib/assessment-engine/types";

const FORMAT_ALIAS: Record<string, QuestionFormatId> = {
  single_choice: "single_select",
  multi_select: "multi_select",
  ordering: "ordering",
  log_analysis_single_choice: "log_analysis_single_select",
  match_pairs: "matching",
  best_next_step: "best_next_step",
  trace_execution: "trace_execution",
  fill_in_blank_constrained: "fill_blank_constrained",
  case_triage: "case_triage"
};

const SCORING_ALIAS: Record<string, ScoringMethod> = {
  all_or_nothing: "all_or_nothing",
  partial_with_penalty: "partial_with_penalty",
  partial_position: "partial_position",
  partial_pairs_with_penalty: "partial_pairs_with_penalty",
  partial_by_blank: "partial_by_blank"
};

function assertRole(raw: string): RoleId {
  return raw as RoleId;
}

function assertStack(raw: string): "General" | StackId {
  if (raw === "General") return "General";
  return raw as StackId;
}

function parseMatchingPromptBlocks(raw: {
  question_text?: string;
  left_items?: string[];
  right_items?: string[];
}) {
  const prompt = String(raw.question_text || "").replace(/\r\n/g, "\n").trim();
  const lines = prompt
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { prompt: "", promptBlocks: undefined as PromptBlock[] | undefined };
  }

  const title = lines[0];
  const leftItems = new Set(Array.isArray(raw.left_items) ? raw.left_items.map(String) : []);
  const rightItems = new Set(Array.isArray(raw.right_items) ? raw.right_items.map(String) : []);
  const remaining = lines.slice(1);
  const promptBlocks: PromptBlock[] = [];

  let index = 0;
  while (index < remaining.length) {
    const current = remaining[index];

    if (current === "Categories:" || current === "Options:") {
      const items: string[] = [];
      index += 1;
      while (index < remaining.length) {
        const next = remaining[index];
        if (next.endsWith(":")) break;
        if (!rightItems.has(next)) break;
        items.push(next);
        index += 1;
      }
      if (items.length > 0) {
        promptBlocks.push({ type: "list", heading: current.slice(0, -1), items, style: "cards" });
      }
      continue;
    }

    if (current === "Items:") {
      index += 1;
      while (index < remaining.length && leftItems.has(remaining[index])) {
        index += 1;
      }
      continue;
    }

    if (leftItems.has(current)) {
      index += 1;
      continue;
    }

    if (rightItems.has(current)) {
      const items: string[] = [];
      while (index < remaining.length && rightItems.has(remaining[index])) {
        items.push(remaining[index]);
        index += 1;
      }
      if (items.length > 0) {
        promptBlocks.push({ type: "list", heading: "Options", items, style: "cards" });
      }
      continue;
    }

    promptBlocks.push({ type: "paragraph", text: current });
    index += 1;
  }

  return {
    prompt: title,
    promptBlocks: promptBlocks.length > 0 ? promptBlocks : undefined
  };
}

export const configV2: ConfigV2 = configRaw as ConfigV2;

export const questionBank: Question[] = (rawBank as any[]).map((raw) => {
  const format = FORMAT_ALIAS[String(raw.format || "single_choice")] ?? "single_select";
  const scoringMethod =
    SCORING_ALIAS[String(raw.scoring_method || "all_or_nothing")] ?? "all_or_nothing";
  const promptPresentation =
    format === "matching"
      ? parseMatchingPromptBlocks(raw as { question_text?: string; left_items?: string[]; right_items?: string[] })
      : {
          prompt: String(raw.question_text || ""),
          promptBlocks: undefined as PromptBlock[] | undefined
        };
  const normalized: Record<string, unknown> = {
    id: String(raw.id),
    roleLevelMin: assertRole(String(raw.role_level_min)),
    roleLevelMax: raw.role_level_max ? assertRole(String(raw.role_level_max)) : null,
    seniorOnly: Boolean(raw.senior_only),
    leadOnly: Boolean(raw.lead_only),
    techStack: assertStack(String(raw.tech_stack || "General")),
    category: String(raw.category || "General"),
    difficulty: Number(raw.difficulty || 2),
    format,
    points: Number(raw.points || 1),
    scoringMethod,
    prompt: promptPresentation.prompt,
    promptBlocks: promptPresentation.promptBlocks,
    explanation: String(raw.explanation || ""),
    rationale: String(raw.rationale || ""),
    logSnippet: raw.log_snippet ? String(raw.log_snippet) : undefined,
    options: Array.isArray(raw.options) ? raw.options.map(String) : undefined,
    correctAnswer: Array.isArray(raw.correct_answer) ? raw.correct_answer.map(String) : undefined,
    items: Array.isArray(raw.items) ? raw.items.map(String) : undefined,
    correctOrder: Array.isArray(raw.correct_order) ? raw.correct_order.map(Number) : undefined,
    leftItems: Array.isArray(raw.left_items) ? raw.left_items.map(String) : undefined,
    rightItems: Array.isArray(raw.right_items) ? raw.right_items.map(String) : undefined,
    correctPairs: raw.correct_pairs || undefined,
    blank: raw.blank ? String(raw.blank) : undefined,
    choices: Array.isArray(raw.choices) ? raw.choices.map(String) : undefined,
    acceptedAnswers: Array.isArray(raw.accepted_answers)
      ? raw.accepted_answers.map(String)
      : undefined
  };
  return normalized as unknown as Question;
});

export function getRoleConfig(roleId: RoleId) {
  return configV2.roles[roleId];
}

export function getQuestionsByIds(ids: string[]) {
  const idSet = new Set(ids);
  return questionBank.filter((q) => idSet.has(q.id));
}
