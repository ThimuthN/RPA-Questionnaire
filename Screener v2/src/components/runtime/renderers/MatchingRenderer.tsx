"use client";

import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";

export function MatchingRenderer({ question, answer, onChange }: BaseQuestionRendererProps) {
  const left = Array.isArray(question.leftItems) ? question.leftItems : [];
  const right = Array.isArray(question.rightItems) ? question.rightItems : [];
  const value = answer && typeof answer === "object" ? (answer as Record<string, string>) : {};

  return (
    <div className="space-y-3">
      {left.map((item: string) => (
        <div
          key={`${question.id}-${item}`}
          className="grid gap-2 rounded-md border border-white/10 bg-white/5 p-3 md:grid-cols-[1fr_1fr]"
        >
          <div className="text-slate-100">{item}</div>
          <select
            className="rounded-md border border-white/20 bg-ink-950 px-3 py-2 text-slate-100"
            value={value[item] || ""}
            onChange={(event) =>
              onChange({
                ...value,
                [item]: event.target.value
              })
            }
          >
            <option value="">Select</option>
            {right.map((option: string) => (
              <option key={`${item}-${option}`} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
