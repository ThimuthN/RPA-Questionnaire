"use client";

import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";

export function PracticalTaskRenderer({ question, answer, onChange }: BaseQuestionRendererProps) {
  const value = answer && typeof answer === "object" ? (answer as Record<string, unknown>) : {};
  const fields = Array.isArray(question.subtasks) ? question.subtasks : [];

  return (
    <div className="space-y-4">
      {fields.map((task: any) => {
        const key = String(task.id || task.label || Math.random());
        const taskType = String(task.type || "text");
        const current = value[key];
        if (taskType === "ordering") {
          const items = Array.isArray(task.items) ? task.items : [];
          return (
            <div key={key} className="rounded-md border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-sm font-semibold text-slate-100">{task.label}</p>
              <select
                className="w-full rounded-md border border-white/20 bg-ink-950 px-3 py-2 text-slate-100"
                value={Array.isArray(current) ? JSON.stringify(current) : ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    [key]: JSON.parse(event.target.value)
                  })
                }
              >
                <option value="">Select ordering</option>
                {[items, [...items].reverse()].map((candidate, index) => (
                  <option key={`${key}-${index}`} value={JSON.stringify(candidate.map((_: any, i: number) => i))}>
                    {candidate.join(" -> ")}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        return (
          <div key={key} className="rounded-md border border-white/10 bg-white/5 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-100">{task.label}</p>
            <input
              className="w-full rounded-md border border-white/20 bg-ink-950 px-3 py-2 text-slate-100"
              value={String(current || "")}
              onChange={(event) =>
                onChange({
                  ...value,
                  [key]: event.target.value
                })
              }
            />
          </div>
        );
      })}
    </div>
  );
}
