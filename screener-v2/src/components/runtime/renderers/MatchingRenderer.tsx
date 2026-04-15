"use client";

import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";

export function MatchingRenderer({ question, answer, onChange }: BaseQuestionRendererProps) {
  const left = Array.isArray(question.leftItems) ? question.leftItems : [];
  const right = Array.isArray(question.rightItems) ? question.rightItems : [];
  const options = [...right];
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
      <div className="rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-4 py-3">
        <p className="text-xs text-[color:var(--app-text)]">Each option can be used once. Used matches become unavailable in the other rows.</p>
      </div>

      {left.map((item: string) => (
        <div
          key={`${question.id}-${item}`}
          className="space-y-3 rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              <span className="text-sm font-medium text-[color:var(--app-heading)]">{item}</span>
            </div>
            {value[item] ? (
              <button
                type="button"
                onClick={() => pick(item, "")}
                className="rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--app-muted)] transition hover:border-[color:var(--app-border-strong)] hover:text-[color:var(--app-heading)]"
              >
                Clear
              </button>
            ) : null}
          </div>

          <label className="grid gap-2">
            <span className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--app-muted)]">Choose the best match</span>
            <select
              value={value[item] ?? ""}
              onChange={(event) => pick(item, event.target.value)}
              className="rounded-[16px] border border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg-strong)] px-4 py-3 text-sm text-[color:var(--app-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80"
            >
              <option value="">
                Select a purpose
              </option>
              {options.map((option) => (
                <option
                  key={`${item}-${option}`}
                  value={option}
                  disabled={isUsedByAnother(item, option)}
                >
                  {option}
                </option>
              ))}
            </select>
          </label>

          <p className={`text-xs ${value[item] ? "text-[color:var(--app-brand-strong)]" : "text-[color:var(--app-muted)]"}`}>
            {value[item] ? (
              <>
                Matched to: <span className="font-medium text-[color:var(--app-heading)]">{value[item]}</span>
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
