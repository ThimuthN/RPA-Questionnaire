"use client";

import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";

export function PracticalTaskRenderer({ question, answer, onChange }: BaseQuestionRendererProps) {
  const value = answer && typeof answer === "object" ? (answer as Record<string, unknown>) : {};
  const fields = Array.isArray(question.subtasks) ? question.subtasks : [];
  const taskCardClassName =
    "rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4";
  const titleClassName = "mb-2 text-sm font-semibold text-[color:var(--app-heading)]";
  const labelClassName = "flex items-center gap-2 text-sm text-[color:var(--app-text)]";
  const selectClassName =
    "w-full rounded-md border border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg-strong)] px-3 py-2 text-[color:var(--app-text)]";

  return (
    <div className="space-y-4">
      {fields.map((task: any) => {
        const key = String(task.id || task.label || Math.random());
        const taskType = String(task.type || "text");
        const current = value[key];
        if (taskType === "single_select") {
          const options = Array.isArray(task.options) ? task.options : [];
          return (
            <div key={key} className={taskCardClassName}>
              <p className={titleClassName}>{task.label}</p>
              <div className="space-y-2">
                {options.map((option: any) => (
                  <label key={`${key}-${option.id}`} className={labelClassName}>
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
            <div key={key} className={taskCardClassName}>
              <p className={titleClassName}>{task.label}</p>
              <div className="space-y-2">
                {leftItems.map((left: string) => (
                  <div key={`${key}-${left}`} className="grid gap-2 md:grid-cols-[1fr_1fr] md:items-center">
                    <p className="text-sm text-[color:var(--app-text)]">{left}</p>
                    <select
                      className={selectClassName}
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
                      <option value="">Select control</option>
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
          <div key={key} className={taskCardClassName}>
            <p className={titleClassName}>{task.label}</p>
            <p className="text-sm text-[color:var(--app-warning)]">Unsupported practical task type.</p>
          </div>
        );
      })}
    </div>
  );
}
