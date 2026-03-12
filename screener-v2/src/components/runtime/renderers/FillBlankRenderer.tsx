"use client";

import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";

export function FillBlankRenderer({ question, answer, onChange }: BaseQuestionRendererProps) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const current = Array.isArray(answer) ? String(answer[0] || "") : String(answer || "");
  return (
    <div className="space-y-3">
      <p className="rounded-md border border-dashed border-brand-300/50 bg-brand-500/10 px-3 py-2 text-slate-100">
        {question.blank || "Select the best completion."}
      </p>
      {choices.map((choice: string, index: number) => (
        <label
          key={`${question.id}-choice-${index}`}
          className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 ${
            current === choice
              ? "border-brand-500 bg-brand-500/10 text-white"
              : "border-white/10 bg-white/5 text-slate-200"
          }`}
        >
          <input
            type="radio"
            name={`fill-${question.id}`}
            checked={current === choice}
            onChange={() => onChange(choice)}
          />
          <span>{choice}</span>
        </label>
      ))}
    </div>
  );
}
