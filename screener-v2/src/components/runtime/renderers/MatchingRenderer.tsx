"use client";

import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";

export function MatchingRenderer({ question, answer, onChange }: BaseQuestionRendererProps) {
  const left = Array.isArray(question.leftItems) ? question.leftItems : [];
  const right = Array.isArray(question.rightItems) ? question.rightItems : [];
  const value = answer && typeof answer === "object" ? (answer as Record<string, string>) : {};

  function pick(item: string, option: string) {
    const isSelected = value[item] === option;
    onChange({ ...value, [item]: isSelected ? "" : option });
  }

  return (
    <div className="space-y-4">
      {left.map((item: string) => (
        <div
          key={`${question.id}-${item}`}
          className="rounded-xl border border-white/10 bg-white/[0.05] p-4 space-y-3"
        >
          {/* Left-side prompt */}
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
            <span className="text-sm font-medium text-slate-100">{item}</span>
          </div>

          {/* Right-side options as pills */}
          <div className="flex flex-wrap gap-2">
            {right.map((option: string) => {
              const selected = value[item] === option;
              return (
                <button
                  key={`${item}-${option}`}
                  type="button"
                  onClick={() => pick(item, option)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                    selected
                      ? "border-brand-400/70 bg-brand-500/20 text-brand-200 shadow-[0_0_0_1px_rgba(47,134,255,0.3)]"
                      : "border-white/12 bg-white/[0.04] text-slate-300 hover:border-white/25 hover:bg-white/[0.08] hover:text-slate-100"
                  }`}
                >
                  {selected && (
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-400" />
                  )}
                  {option}
                </button>
              );
            })}
          </div>

          {/* Selected indicator */}
          {value[item] ? (
            <p className="text-xs text-brand-300/80">
              Matched to: <span className="font-medium text-brand-200">{value[item]}</span>
            </p>
          ) : (
            <p className="text-xs text-slate-500">No match selected</p>
          )}
        </div>
      ))}
    </div>
  );
}
