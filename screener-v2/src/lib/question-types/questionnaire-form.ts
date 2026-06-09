import { z } from "zod";
import { QuestionnaireFormRenderer } from "@/components/runtime/renderers/QuestionnaireFormRenderer";
import { GenericReviewRenderer } from "@/components/runtime/renderers/ReviewRenderer";
import type {
  QuestionnaireAnswer,
  QuestionnaireField,
  QuestionnaireFormQuestion
} from "@/lib/assessment-engine/types";
import type { QuestionTypeDef } from "@/lib/question-types/types";

const EMPTY_ANSWER_LABEL = "\u2014";

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

const VALID_CURRENCIES = ["USD", "INR", "LKR"] as const;
const VALID_PERIODS = ["hourly", "monthly", "annual"] as const;

function isCurrencyAnswer(field: QuestionnaireField, value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const answer = value as Record<string, unknown>;
  const amount =
    typeof answer.amount === "number" ? answer.amount : Number(answer.amount);

  return (
    VALID_CURRENCIES.includes(answer.currency as (typeof VALID_CURRENCIES)[number]) &&
    Number.isFinite(amount) &&
    amount >= (field.min ?? 0) &&
    (typeof field.max !== "number" || amount <= field.max) &&
    VALID_PERIODS.includes(answer.period as (typeof VALID_PERIODS)[number])
  );
}

function hasAllowedSingleSelectValue(field: QuestionnaireField, answer: string): boolean {
  return !field.options || field.options.some((option) => option.value === answer);
}

function hasAllowedMultiSelectValues(field: QuestionnaireField, answer: string[]): boolean {
  if (!field.options) {
    return true;
  }

  const allowedValues = new Set(field.options.map((option) => option.value));
  return answer.every((value) => allowedValues.has(value));
}

export function isQuestionnaireFieldAnswered(
  field: QuestionnaireField,
  answer: unknown
): boolean {
  if (answer === null || answer === undefined) {
    return false;
  }

  switch (field.type) {
    case "yes_no":
      return answer === true || answer === false;
    case "text":
      return typeof answer === "string" && answer.trim().length > 0;
    case "number": {
      const value = typeof answer === "number" ? answer : Number(answer);
      return (
        Number.isFinite(value) &&
        (typeof field.min !== "number" || value >= field.min) &&
        (typeof field.max !== "number" || value <= field.max)
      );
    }
    case "single_select":
      return (
        typeof answer === "string" &&
        answer.trim().length > 0 &&
        hasAllowedSingleSelectValue(field, answer)
      );
    case "multi_select":
      return (
        Array.isArray(answer) &&
        answer.length > 0 &&
        answer.every((value) => typeof value === "string" && value.trim().length > 0) &&
        hasAllowedMultiSelectValues(field, answer as string[])
      );
    case "currency_amount":
      return isCurrencyAnswer(field, answer);
    default:
      return false;
  }
}

function validateFieldAnswer(field: QuestionnaireField, answer: unknown): string | null {
  if (answer === null || answer === undefined) {
    return field.required ? `Required field "${field.label}" is not answered.` : null;
  }

  if (field.type === "yes_no") {
    return answer === true || answer === false
      ? null
      : `Field "${field.label}" must be answered Yes or No.`;
  }

  if (field.type === "text") {
    if (typeof answer !== "string") {
      return `Field "${field.label}" must be text.`;
    }

    return answer.trim().length > 0 || !field.required
      ? null
      : `Required field "${field.label}" is not answered.`;
  }

  if (field.type === "number") {
    const value = typeof answer === "number" ? answer : Number(answer);
    if (!Number.isFinite(value)) {
      return `Field "${field.label}" must be a valid number.`;
    }
    if (typeof field.min === "number" && value < field.min) {
      return `Field "${field.label}" must be at least ${field.min}.`;
    }
    if (typeof field.max === "number" && value > field.max) {
      return `Field "${field.label}" must be at most ${field.max}.`;
    }
    return null;
  }

  if (field.type === "single_select") {
    if (typeof answer !== "string" || answer.trim().length === 0) {
      return field.required ? `Required field "${field.label}" is not answered.` : null;
    }
    return hasAllowedSingleSelectValue(field, answer)
      ? null
      : `Field "${field.label}" has an invalid selection.`;
  }

  if (field.type === "multi_select") {
    if (!Array.isArray(answer)) {
      return `Field "${field.label}" must be a list of selections.`;
    }
    if (answer.length === 0) {
      return field.required ? `Required field "${field.label}" is not answered.` : null;
    }

    const normalized = answer.filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    );

    if (normalized.length !== answer.length || !hasAllowedMultiSelectValues(field, normalized)) {
      return `Field "${field.label}" has an invalid selection.`;
    }

    return null;
  }

  return isCurrencyAnswer(field, answer)
    ? null
    : `Field "${field.label}" must include currency, amount, and period.`;
}

function validateAnswer(
  question: QuestionnaireFormQuestion,
  answer: QuestionnaireAnswer
): { ok: boolean; reason?: string } {
  for (const field of question.fields) {
    const reason = validateFieldAnswer(field, answer[field.id]);
    if (reason) {
      return { ok: false, reason };
    }
  }

  return { ok: true };
}

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

function formatCurrencyAnswer(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return EMPTY_ANSWER_LABEL;
  }

  const answer = value as Record<string, unknown>;
  const amount = Number(answer.amount);
  if (
    !VALID_CURRENCIES.includes(answer.currency as (typeof VALID_CURRENCIES)[number]) ||
    !Number.isFinite(amount) ||
    !VALID_PERIODS.includes(answer.period as (typeof VALID_PERIODS)[number])
  ) {
    return EMPTY_ANSWER_LABEL;
  }

  return `${answer.currency} ${amount.toLocaleString()} / ${answer.period}`;
}

export function formatQuestionnaireFieldAnswer(
  field: QuestionnaireField,
  value: unknown
): string {
  if (value === null || value === undefined) {
    return EMPTY_ANSWER_LABEL;
  }

  switch (field.type) {
    case "yes_no":
      if (value === true) return "Yes";
      if (value === false) return "No";
      return EMPTY_ANSWER_LABEL;
    case "text":
      return typeof value === "string" && value.trim() ? value.trim() : EMPTY_ANSWER_LABEL;
    case "number":
      return Number.isFinite(Number(value)) ? String(value) : EMPTY_ANSWER_LABEL;
    case "single_select": {
      if (typeof value !== "string") {
        return EMPTY_ANSWER_LABEL;
      }
      const option = field.options?.find((entry) => entry.value === value);
      return option ? option.label : value;
    }
    case "multi_select": {
      if (!Array.isArray(value) || value.length === 0) {
        return EMPTY_ANSWER_LABEL;
      }
      return value
        .map((entry) => {
          const option = field.options?.find((candidate) => candidate.value === entry);
          return option ? option.label : String(entry);
        })
        .join(", ");
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
    const formatted = formatQuestionnaireFieldAnswer(field, answer[field.id]);
    const requiredMark = field.required ? "" : " (optional)";
    return `${field.label}${requiredMark}: ${formatted}`;
  });

  return { lines };
}

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
