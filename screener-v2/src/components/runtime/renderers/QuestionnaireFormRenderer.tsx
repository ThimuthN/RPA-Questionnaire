"use client";

import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";
import type { QuestionnaireField } from "@/lib/assessment-engine/types";
import { cn } from "@/lib/utils";

const CURRENCIES = ["USD", "INR", "LKR"] as const;
const PERIODS = [
  { value: "hourly", label: "Hourly" },
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" }
] as const;

function fieldCardClass() {
  return "rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 space-y-3";
}

function labelClass() {
  return "block text-sm font-medium text-[color:var(--app-heading)]";
}

function descClass() {
  return "block text-xs text-[color:var(--app-muted)] mt-0.5";
}

function inputClass() {
  return "w-full rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2.5 text-sm text-[color:var(--app-text)] placeholder-[color:var(--app-muted)] outline-none transition focus:border-[color:var(--app-brand)]/50 focus:ring-1 focus:ring-[color:var(--app-brand)]/30";
}

function selectClass() {
  return "rounded-[14px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2.5 text-sm text-[color:var(--app-text)] outline-none transition focus:border-[color:var(--app-brand)]/50 focus:ring-1 focus:ring-[color:var(--app-brand)]/30";
}

// --- Yes / No field ---

function YesNoField({
  value,
  onChange
}: {
  value: unknown;
  onChange: (v: boolean) => void;
}) {
  const current = value === true ? true : value === false ? false : null;

  function btnClass(active: boolean) {
    return cn(
      "flex-1 rounded-[12px] border px-4 py-2.5 text-sm font-medium transition",
      active
        ? "border-[color:var(--app-brand)] bg-[color:var(--app-brand)]/10 text-[color:var(--app-brand)]"
        : "border-[color:var(--app-border)] bg-[color:var(--app-surface)] text-[color:var(--app-text)] hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]"
    );
  }

  return (
    <div className="flex gap-2">
      <button type="button" className={btnClass(current === true)} onClick={() => onChange(true)}>
        Yes
      </button>
      <button type="button" className={btnClass(current === false)} onClick={() => onChange(false)}>
        No
      </button>
    </div>
  );
}

// --- Currency Amount field ---

function CurrencyAmountField({
  field,
  value,
  onChange
}: {
  field: QuestionnaireField;
  value: unknown;
  onChange: (v: Record<string, unknown>) => void;
}) {
  const current =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const currency = typeof current.currency === "string" ? current.currency : "";
  const amount = typeof current.amount === "number" ? current.amount : "";
  const period = typeof current.period === "string" ? current.period : "";

  return (
    <div className="grid gap-2 sm:grid-cols-[140px_1fr_140px]">
      <select
        aria-label="Currency"
        value={currency}
        onChange={(e) => onChange({ ...current, currency: e.target.value })}
        className={selectClass()}
      >
        <option value="">Currency</option>
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        type="number"
        aria-label="Amount"
        min={field.min ?? 0}
        max={field.max}
        placeholder="Amount"
        value={amount}
        onChange={(e) => {
          const parsed = parseFloat(e.target.value);
          onChange({ ...current, amount: Number.isFinite(parsed) ? parsed : "" });
        }}
        className={inputClass()}
      />
      <select
        aria-label="Period"
        value={period}
        onChange={(e) => onChange({ ...current, period: e.target.value })}
        className={selectClass()}
      >
        <option value="">Period</option>
        {PERIODS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// --- Single select field ---

function SingleSelectField({
  field,
  value,
  onChange
}: {
  field: QuestionnaireField;
  value: unknown;
  onChange: (v: string) => void;
}) {
  const current = typeof value === "string" ? value : "";
  const options = field.options ?? [];

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const active = current === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-[14px] border px-3 py-2.5 text-sm transition",
              active
                ? "border-[color:var(--app-brand)] bg-[color:var(--app-brand)]/10 text-[color:var(--app-brand)]"
                : "border-[color:var(--app-border)] bg-[color:var(--app-surface)] text-[color:var(--app-text)] hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]"
            )}
          >
            <input
              type="radio"
              name={field.id}
              value={option.value}
              checked={active}
              onChange={() => onChange(option.value)}
              className="shrink-0"
            />
            <span className="font-medium">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

// --- Multi select field ---

function MultiSelectField({
  field,
  value,
  onChange
}: {
  field: QuestionnaireField;
  value: unknown;
  onChange: (v: string[]) => void;
}) {
  const current: string[] = Array.isArray(value) ? (value as string[]) : [];
  const options = field.options ?? [];

  function toggle(optValue: string) {
    if (current.includes(optValue)) {
      onChange(current.filter((v) => v !== optValue));
    } else {
      onChange([...current, optValue]);
    }
  }

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const checked = current.includes(option.value);
        return (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-[14px] border px-3 py-2.5 text-sm transition",
              checked
                ? "border-[color:var(--app-brand)] bg-[color:var(--app-brand)]/10 text-[color:var(--app-brand)]"
                : "border-[color:var(--app-border)] bg-[color:var(--app-surface)] text-[color:var(--app-text)] hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)]"
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(option.value)}
              className="shrink-0"
            />
            <span className="font-medium">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

// --- Main renderer ---

export function QuestionnaireFormRenderer({ question, answer, onChange }: BaseQuestionRendererProps) {
  const fields: QuestionnaireField[] = Array.isArray(question.fields) ? question.fields : [];
  const currentAnswer: Record<string, unknown> =
    answer && typeof answer === "object" && !Array.isArray(answer)
      ? (answer as Record<string, unknown>)
      : {};

  function updateField(fieldId: string, value: unknown) {
    onChange({ ...currentAnswer, [fieldId]: value });
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const fieldValue = currentAnswer[field.id];

        return (
          <div key={field.id} className={fieldCardClass()}>
            <div>
              <span className={labelClass()}>
                {field.label}
                {field.required ? (
                  <span className="ml-1 text-[color:var(--app-danger)]" aria-hidden="true">
                    *
                  </span>
                ) : (
                  <span className="ml-1 text-xs font-normal text-[color:var(--app-muted)]">(optional)</span>
                )}
              </span>
              {field.description ? <span className={descClass()}>{field.description}</span> : null}
            </div>

            {field.type === "yes_no" ? (
              <YesNoField
                value={fieldValue}
                onChange={(v) => updateField(field.id, v)}
              />
            ) : field.type === "currency_amount" ? (
              <CurrencyAmountField
                field={field}
                value={fieldValue}
                onChange={(v) => updateField(field.id, v)}
              />
            ) : field.type === "single_select" ? (
              <SingleSelectField
                field={field}
                value={fieldValue}
                onChange={(v) => updateField(field.id, v)}
              />
            ) : field.type === "multi_select" ? (
              <MultiSelectField
                field={field}
                value={fieldValue}
                onChange={(v) => updateField(field.id, v)}
              />
            ) : field.type === "number" ? (
              <input
                type="number"
                value={typeof fieldValue === "number" ? fieldValue : ""}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                onChange={(e) => {
                  const parsed = parseFloat(e.target.value);
                  updateField(field.id, Number.isFinite(parsed) ? parsed : undefined);
                }}
                className={inputClass()}
              />
            ) : (
              <input
                type="text"
                value={typeof fieldValue === "string" ? fieldValue : ""}
                placeholder={field.placeholder}
                onChange={(e) => updateField(field.id, e.target.value)}
                className={inputClass()}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
