"use client";

import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";

interface ChoiceRendererProps extends BaseQuestionRendererProps {
  multiple?: boolean;
}

export function ChoiceRenderer({ question, answer, onChange, multiple = false }: ChoiceRendererProps) {
  const options = Array.isArray(question.options) ? question.options : [];
  const selectedMany: number[] = multiple
    ? (Array.isArray(answer) ? answer.map((value) => Number(value)) : [])
    : [];
  const selectedOne = multiple ? -1 : Number(answer);

  return (
    <div className="space-y-2.5">
      {options.map((option: string, index: number) => {
        const checked = multiple ? selectedMany.includes(index) : selectedOne === index;
        return (
          <label
            key={`${question.id}-${index}`}
            className={`group flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-all duration-150 ${
              checked
                ? "border-brand-400/60 bg-brand-500/10 shadow-[0_0_0_1px_rgba(47,134,255,0.2)]"
                : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
            }`}
          >
            {/* Hidden native input for a11y + form semantics */}
            <input
              type={multiple ? "checkbox" : "radio"}
              name={`q-${question.id}`}
              checked={checked}
              className="sr-only"
              onChange={() => {
                if (!multiple) {
                  onChange(index);
                  return;
                }
                const set = new Set<number>(Array.isArray(answer) ? answer : []);
                if (set.has(index)) set.delete(index);
                else set.add(index);
                onChange(Array.from(set).sort((a, b) => a - b));
              }}
            />

            {/* Custom indicator */}
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center transition-all duration-150 ${
                multiple ? "rounded-[5px]" : "rounded-full"
              } border ${
                checked
                  ? "border-brand-400 bg-brand-500"
                  : "border-white/25 bg-white/[0.04] group-hover:border-white/40"
              }`}
            >
              {checked && (
                multiple ? (
                  /* Checkmark */
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden>
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  /* Radio dot */
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                )
              )}
            </span>

            <span className={`text-sm leading-relaxed ${checked ? "text-white" : "text-slate-200"}`}>
              {option}
            </span>
          </label>
        );
      })}
    </div>
  );
}
