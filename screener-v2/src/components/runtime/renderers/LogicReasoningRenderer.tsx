"use client";

import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";
import {
  StructuredPromptBlocks,
  StructuredPromptContent
} from "@/components/runtime/renderers/StructuredPromptContent";

export function LogicReasoningRenderer({ question, answer, onChange }: BaseQuestionRendererProps) {
  const value = answer && typeof answer === "object" ? (answer as Record<string, unknown>) : {};
  const fields = Array.isArray(question.subtasks) ? question.subtasks : [];
  const taskCardClassName =
    "rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4";
  const titleClassName = "text-base font-semibold leading-6 text-[color:var(--app-heading)]";
  const labelClassName = "flex items-start gap-2 text-sm text-[color:var(--app-text)]";
  const selectClassName =
    "w-full rounded-md border border-[color:var(--app-border-strong)] bg-[color:var(--app-control-bg-strong)] px-3 py-2 text-[color:var(--app-text)]";

  return (
    <div className="space-y-4">
      {fields.map((task: any) => {
        const key = String(task.id || task.label || Math.random());
        const taskType = String(task.type || "text");
        const current = value[key];
        const label = String(task.label || "").replace(/\r\n/g, "\n").trim();
        const labelLines = label.split("\n").map((line) => line.trim()).filter(Boolean);
        const title = labelLines[0] ?? label;
        const body = labelLines.length > 1 ? label.slice(title.length).trim() : "";
        const promptBlocks = Array.isArray(task.promptBlocks) ? task.promptBlocks : [];

        if (taskType === "single_select") {
          const options = Array.isArray(task.options) ? task.options : [];
          return (
            <div key={key} className={taskCardClassName}>
              <div className="space-y-3">
                <p className={titleClassName}>{title}</p>
                {promptBlocks.length > 0 ? (
                  <StructuredPromptBlocks blocks={promptBlocks} className="space-y-4" />
                ) : body ? (
                  <StructuredPromptContent text={body} className="space-y-4" />
                ) : null}
              </div>
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
                    <span className="leading-6">{option.label}</span>
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
              <div className="space-y-3">
                <p className={titleClassName}>{title}</p>
                {promptBlocks.length > 0 ? (
                  <StructuredPromptBlocks blocks={promptBlocks} className="space-y-4" />
                ) : body ? (
                  <StructuredPromptContent text={body} className="space-y-4" />
                ) : null}
              </div>
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
          <div key={key} className={taskCardClassName}>
            <div className="space-y-3">
              <p className={titleClassName}>{title}</p>
              {promptBlocks.length > 0 ? (
                <StructuredPromptBlocks blocks={promptBlocks} className="space-y-4" />
              ) : body ? (
                <StructuredPromptContent text={body} className="space-y-4" />
              ) : null}
            </div>
            <p className="text-sm text-[color:var(--app-warning)]">Unsupported logic reasoning task type.</p>
          </div>
        );
      })}
    </div>
  );
}
