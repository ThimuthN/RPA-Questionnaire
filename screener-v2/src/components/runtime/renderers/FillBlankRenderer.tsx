"use client";

import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";

export function FillBlankRenderer({ question, answer, onChange }: BaseQuestionRendererProps) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const current = Array.isArray(answer) ? String(answer[0] || "") : String(answer || "");

  return (
    <div className="space-y-3">
      {/* Blank context */}
      <p className="rounded-xl border border-[color:color-mix(in_srgb,var(--app-brand)_30%,transparent)] bg-[color:var(--app-brand-soft)] px-4 py-3 text-sm text-[color:var(--app-heading)]">
        <span className="mr-2 text-[color:var(--app-brand-strong)] text-xs font-medium uppercase tracking-wide">Complete:</span>
        {question.blank || "Select the best completion."}
      </p>

      {/* Choices */}
      <div className="space-y-2.5">
        {choices.map((choice: string, index: number) => {
          const checked = current === choice;
          return (
            <label
              key={`${question.id}-choice-${index}`}
              className={`group flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-all duration-150 ${
                checked
                  ? "border-[color:color-mix(in_srgb,var(--app-brand)_55%,transparent)] bg-[color:var(--app-brand-soft)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--app-brand)_20%,transparent)]"
                  : "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-control-bg)]"
              }`}
            >
              <input
                type="radio"
                name={`fill-${question.id}`}
                checked={checked}
                className="sr-only"
                onChange={() => onChange(choice)}
              />

              {/* Custom radio indicator */}
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-150 ${
                  checked
                    ? "border-brand-400 bg-brand-500"
                    : "border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg)] group-hover:border-[color:color-mix(in_srgb,var(--app-brand)_45%,transparent)]"
                }`}
              >
                {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>

              <span className={`text-sm leading-relaxed ${checked ? "text-[color:var(--app-heading)]" : "text-[color:var(--app-text)]"}`}>
                {choice}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
