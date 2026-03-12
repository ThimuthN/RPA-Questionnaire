"use client";

import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";

export function OrderingRenderer({ question, answer, onChange }: BaseQuestionRendererProps) {
  const items = Array.isArray(question.items) ? question.items : [];
  const current =
    Array.isArray(answer) && answer.length === items.length
      ? (answer as number[])
      : Array.from({ length: items.length }, (_, i) => i);

  function move(idx: number, direction: -1 | 1) {
    const next = current.slice();
    const target = idx + direction;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  return (
    <ul className="space-y-2">
      {current.map((itemIndex: number, idx: number) => (
        <li
          key={`${question.id}-${itemIndex}`}
          className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2"
        >
          <span className="text-slate-100">{items[itemIndex]}</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-white/20 px-2 py-1 text-xs text-slate-200 disabled:opacity-40"
              onClick={() => move(idx, -1)}
              disabled={idx === 0}
            >
              Up
            </button>
            <button
              type="button"
              className="rounded border border-white/20 px-2 py-1 text-xs text-slate-200 disabled:opacity-40"
              onClick={() => move(idx, 1)}
              disabled={idx === current.length - 1}
            >
              Down
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
