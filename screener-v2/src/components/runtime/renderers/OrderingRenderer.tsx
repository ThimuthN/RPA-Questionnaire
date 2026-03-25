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
          className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
        >
          {/* Position badge */}
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-semibold text-brand-300">
            {idx + 1}
          </span>

          {/* Item text */}
          <span className="flex-1 text-sm text-slate-100">{items[itemIndex]}</span>

          {/* Move buttons */}
          <div className="flex flex-col gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              aria-label="Move up"
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-25"
              onClick={() => move(idx, -1)}
              disabled={idx === 0}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M6 2.5L2 7.5h8L6 2.5z" fill="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Move down"
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-25"
              onClick={() => move(idx, 1)}
              disabled={idx === current.length - 1}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M6 9.5L2 4.5h8L6 9.5z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
