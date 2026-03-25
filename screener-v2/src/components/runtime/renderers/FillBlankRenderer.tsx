"use client";

import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";

export function FillBlankRenderer({ question, answer, onChange }: BaseQuestionRendererProps) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const current = Array.isArray(answer) ? String(answer[0] || "") : String(answer || "");

  return (
    <div className="space-y-3">
      {/* Blank context */}
      <p className="rounded-xl border border-brand-400/30 bg-brand-500/[0.08] px-4 py-3 text-sm text-slate-100">
        <span className="mr-2 text-brand-300/70 text-xs font-medium uppercase tracking-wide">Complete:</span>
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
                  ? "border-brand-400/60 bg-brand-500/10 shadow-[0_0_0_1px_rgba(47,134,255,0.2)]"
                  : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
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
                    : "border-white/25 bg-white/[0.04] group-hover:border-white/40"
                }`}
              >
                {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>

              <span className={`text-sm leading-relaxed ${checked ? "text-white" : "text-slate-200"}`}>
                {choice}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
