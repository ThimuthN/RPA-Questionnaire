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
    <div className="space-y-3">
      {options.map((option: string, index: number) => {
        const checked = multiple ? selectedMany.includes(index) : selectedOne === index;
        return (
          <label
            key={`${question.id}-${index}`}
            className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 transition ${
              checked
                ? "border-brand-500 bg-brand-500/10 text-white"
                : "border-white/10 bg-white/5 text-slate-200 hover:border-brand-300/50"
            }`}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name={`q-${question.id}`}
              checked={checked}
              className="mt-1"
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
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );
}
