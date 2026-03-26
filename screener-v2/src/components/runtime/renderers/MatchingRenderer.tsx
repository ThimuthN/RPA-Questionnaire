"use client";

import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";

function stableOptionOrder(seed: string, value: string) {
  let hash = 0;
  const source = `${seed}:${value}`;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 100000;
  }
  return hash;
}

export function MatchingRenderer({ question, answer, onChange }: BaseQuestionRendererProps) {
  const left = Array.isArray(question.leftItems) ? question.leftItems : [];
  const right = Array.isArray(question.rightItems) ? question.rightItems : [];
  const options = [...right].sort((a, b) => stableOptionOrder(question.id, a) - stableOptionOrder(question.id, b));
  const value = answer && typeof answer === "object" ? (answer as Record<string, string>) : {};

  function pick(item: string, option: string) {
    const next = { ...value };

    if (!option) {
      delete next[item];
      onChange(next);
      return;
    }

    for (const [otherItem, selectedOption] of Object.entries(next)) {
      if (otherItem !== item && selectedOption === option) {
        delete next[otherItem];
      }
    }

    next[item] = option;
    onChange(next);
  }

  function isUsedByAnother(item: string, option: string) {
    return Object.entries(value).some(([otherItem, selectedOption]) => otherItem !== item && selectedOption === option);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
        <p className="text-xs text-slate-300">Each option can be used once. Used matches become unavailable in the other rows.</p>
      </div>

      {left.map((item: string) => (
        <div
          key={`${question.id}-${item}`}
          className="rounded-xl border border-white/10 bg-white/[0.05] p-4 space-y-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              <span className="text-sm font-medium text-slate-100">{item}</span>
            </div>
            {value[item] ? (
              <button
                type="button"
                onClick={() => pick(item, "")}
                className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-300 transition hover:border-white/24 hover:text-white"
              >
                Clear
              </button>
            ) : null}
          </div>

          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Choose the best match</span>
            <select
              value={value[item] ?? ""}
              onChange={(event) => pick(item, event.target.value)}
              className="rounded-[16px] border border-white/14 bg-white/[0.05] px-4 py-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            >
              <option value="" className="bg-ink-950 text-slate-300">
                Select a purpose
              </option>
              {options.map((option) => (
                <option
                  key={`${item}-${option}`}
                  value={option}
                  disabled={isUsedByAnother(item, option)}
                  className="bg-ink-950 text-white"
                >
                  {option}
                </option>
              ))}
            </select>
          </label>

          <p className={`text-xs ${value[item] ? "text-brand-300/90" : "text-slate-500"}`}>
            {value[item] ? (
              <>
                Matched to: <span className="font-medium text-brand-200">{value[item]}</span>
              </>
            ) : (
              "No match selected"
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
