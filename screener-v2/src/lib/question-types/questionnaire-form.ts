import { z } from "zod";
import type { QuestionTypeDef } from "@/lib/question-types/types";
import type {
  QuestionnaireAnswer,
  QuestionnaireField,
  QuestionnaireFormQuestion
} from "@/lib/assessment-engine/types";
import { QuestionnaireFormRenderer } from "@/components/runtime/renderers/QuestionnaireFormRenderer";
import { GenericReviewRenderer } from "@/components/runtime/renderers/ReviewRenderer";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const fieldOptionSchema = z.object({
  value: z.string(),
  label: z.string()
});

const fieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  type: z.enum(["yes_no", "text", "number", "single_select", "multi_select", "currency_amount"]),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.array(fieldOptionSchema).optional(),
  min: z.number().optional(),
  max: z.number().optional()
});

const questionnaireFormSchema = z.object({
  id: z.string(),
  format: z.literal("questionnaire_form"),
  prompt: z.string(),
  points: z.number(),
  fields: z.array(fieldSchema)
});

const questionnaireAnswerSchema = z.record(z.string(), z.unknown());

// ---------------------------------------------------------------------------
// Currency answer shape
// ---------------------------------------------------------------------------

const VALID_CURRENCIES = ["USD", "INR", "LKR"] as const;
const VALID_PERIODS = ["hourly", "monthly", "annual"] as const;

function isCurrencyAnswer(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  return (
    VALID_CURRENCIES.includes(obj.currency as (typeof VALID_CURRENCIES)[number]) &&
    typeof obj.amount === "number" &&
    Number.isFinite(obj.amount) &&
    obj.amount >= 0 &&
    VALID_PERIODS.includes(obj.period as (typeof VALID_PERIODS)[number])
  );
}

// ---------------------------------------------------------------------------
// Field answer validation
// ---------------------------------------------------------------------------

function isFieldAnswered(field: QuestionnaireField, answer: unknown): boolean {
  if (answer === null || answer === undefined) return false;

  switch (field.type) {
    case "yes_no":
      return answer === true || answer === false;
    case "text":
      return typeof answer === "string" && answer.trim().length > 0;
    case "number": {
      const num = typeof answer === "number" ? answer : Number(answer);
      return Number.isFinite(num);
    }
    case "single_select":
      return typeof answer === "string" && answer.trim().length > 0;
    case "multi_select":
      return Array.isArray(answer) && answer.length > 0;
    case "currency_amount":
      return isCurrencyAnswer(answer);
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// validateAnswer
// ---------------------------------------------------------------------------

function validateAnswer(
  question: QuestionnaireFormQuestion,
  answer: QuestionnaireAnswer
): { ok: boolean; reason?: string } {
  for (const field of question.fields) {
    if (!field.required) continue;
    if (!isFieldAnswered(field, answer[field.id])) {
      return { ok: false, reason: `Required field "${field.label}" is not answered.` };
    }
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// score — completion only: 1 if all required fields answered, 0 otherwise
// ---------------------------------------------------------------------------

function score(
  question: QuestionnaireFormQuestion,
  answer: QuestionnaireAnswer
): { normalized: number; pointsEarned: number; isCorrect: boolean } {
  const { ok } = validateAnswer(question, answer);
  const pointsPossible = Number(question.points || 1);
  return {
    normalized: ok ? 1 : 0,
    pointsEarned: ok ? pointsPossible : 0,
    isCorrect: ok
  };
}

// ---------------------------------------------------------------------------
// toReviewModel — readable label/value pairs
// ---------------------------------------------------------------------------

function formatCurrencyAnswer(value: unknown): string {
  if (!isCurrencyAnswer(value)) return "—";
  const obj = value as Record<string, unknown>;
  const amount = Number(obj.amount).toLocaleString();
  return `${obj.currency} ${amount} / ${obj.period}`;
}

function formatFieldAnswer(field: QuestionnaireField, value: unknown): string {
  if (value === null || value === undefined) return "—";

  switch (field.type) {
    case "yes_no":
      if (value === true) return "Yes";
      if (value === false) return "No";
      return "—";
    case "text":
      return typeof value === "string" && value.trim() ? value.trim() : "—";
    case "number":
      return Number.isFinite(Number(value)) ? String(value) : "—";
    case "single_select": {
      if (typeof value !== "string") return "—";
      const option = field.options?.find((opt) => opt.value === value);
      return option ? option.label : value;
    }
    case "multi_select": {
      if (!Array.isArray(value) || value.length === 0) return "—";
      const labels = (value as string[]).map((v) => {
        const option = field.options?.find((opt) => opt.value === v);
        return option ? option.label : String(v);
      });
      return labels.join(", ");
    }
    case "currency_amount":
      return formatCurrencyAnswer(value);
    default:
      return String(value);
  }
}

function toReviewModel(
  question: QuestionnaireFormQuestion,
  answer: QuestionnaireAnswer
): { lines: string[] } {
  const lines = question.fields.map((field) => {
    const value = answer[field.id];
    const formatted = formatFieldAnswer(field, value);
    const requiredMark = field.required ? "" : " (optional)";
    return `${field.label}${requiredMark}: ${formatted}`;
  });
  return { lines };
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const questionnaireFormDef: QuestionTypeDef<
  QuestionnaireFormQuestion,
  QuestionnaireAnswer,
  { lines: string[] }
> = {
  type: "questionnaire_form",
  runtimeLabel: "Questionnaire",
  runtimeHint: "Complete each question carefully. Required fields are marked.",
  schema: questionnaireFormSchema as z.ZodType<QuestionnaireFormQuestion>,
  answerSchema: questionnaireAnswerSchema,
  validateAnswer,
  score,
  toReviewModel,
  Renderer: QuestionnaireFormRenderer,
  ReviewRenderer: GenericReviewRenderer
};
