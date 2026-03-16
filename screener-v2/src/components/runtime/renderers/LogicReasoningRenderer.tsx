"use client";

import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";

export function LogicReasoningRenderer({ question, answer, onChange }: BaseQuestionRendererProps) {
  const value = answer && typeof answer === "object" ? (answer as Record<string, unknown>) : {};
  const fields = Array.isArray(question.subtasks) ? question.subtasks : [];

  return (
    <div className="space-y-4">
      {fields.map((task: any) => {
        const key = String(task.id || task.label || Math.random());
        const taskType = String(task.type || "text");
        const current = value[key];
        if (taskType === "single_select") {
          const options = Array.isArray(task.options) ? task.options : [];
          return (
            <div key={key} className="rounded-md border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-sm font-semibold text-slate-100">{task.label}</p>
              <div className="space-y-2">
                {options.map((option: any) => (
                  <label key={`${key}-${option.id}`} className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="radio"
                      name={key}
                      value={String(option.id)}
                      checked={String(current || "") === String(option.id)}
                      onChange={() =>
                        onChange({
                          ...value,
                          [key]: String(option.id)
                        })
                      }
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        }

        if (taskType === "matching") {
          const leftItems = Array.isArray(task.leftItems) ? task.leftItems : [];
          const rightOptions = Array.isArray(task.rightOptions) ? task.rightOptions : [];
          const currentMap =
            current && typeof current === "object" && !Array.isArray(current)
              ? (current as Record<string, unknown>)
              : {};
          return (
            <div key={key} className="rounded-md border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-sm font-semibold text-slate-100">{task.label}</p>
              <div className="space-y-2">
                {leftItems.map((left: string) => (
                  <div key={`${key}-${left}`} className="grid gap-2 md:grid-cols-[1fr_1fr] md:items-center">
                    <p className="text-sm text-slate-200">{left}</p>
                    <select
                      className="w-full rounded-md border border-white/20 bg-ink-950 px-3 py-2 text-slate-100"
                      value={String(currentMap[left] || "")}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          [key]: {
                            ...currentMap,
                            [left]: event.target.value
                          }
                        })
                      }
                    >
                      <option value="">Select option</option>
                      {rightOptions.map((option: any) => (
                        <option key={`${left}-${option.id}`} value={String(option.id)}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={key} className="rounded-md border border-white/10 bg-white/5 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-100">{task.label}</p>
            <p className="text-sm text-amber-200">Unsupported logic reasoning task type.</p>
          </div>
        );
      })}
    </div>
  );
}