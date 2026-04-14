"use client";

import type { ReactNode } from "react";
import type { ExamConfigFieldDefinition } from "@/lib/assessment-engine/types";

function fieldShell(field: ExamConfigFieldDefinition, control: ReactNode) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm text-[color:var(--app-heading)]">{field.label}</p>
        {field.description ? <p className="text-xs text-[color:var(--app-muted)]">{field.description}</p> : null}
      </div>
      {control}
    </div>
  );
}

export function ConfigFieldEditor({
  field,
  value,
  onChange
}: {
  field: ExamConfigFieldDefinition;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  if (field.type === "single_select" || field.type === "multi_select") {
    const selectedValues = Array.isArray(value) ? value.map(String) : [];
    const singleValue = typeof value === "string" ? value : "";

    return fieldShell(
      field,
      <div className="flex flex-wrap gap-2">
        {field.options.map((option) => {
          const active =
            field.type === "multi_select"
              ? selectedValues.includes(option.value)
              : singleValue === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (field.type === "multi_select") {
                  onChange(
                    active
                      ? selectedValues.filter((item) => item !== option.value)
                      : [...selectedValues, option.value]
                  );
                  return;
                }
                onChange(option.value);
              }}
              className={`rounded-full border px-4 py-2 text-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 ${
                active
                  ? "border-brand-300 bg-brand-500/18 text-white shadow-[0_14px_32px_rgba(31,111,255,0.18)]"
                  : "border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] text-[color:var(--app-text)] hover:border-brand-300/50 hover:bg-[color:var(--app-surface-soft)]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.type === "text") {
    const textValue = typeof value === "string" ? value : "";
    return fieldShell(
      field,
      <input
        type="text"
        value={textValue}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60"
      />
    );
  }

  if (field.type === "number") {
    const numericValue =
      typeof value === "number" && Number.isFinite(value)
        ? String(value)
        : typeof value === "string"
          ? value
          : "";
    return fieldShell(
      field,
      <input
        type="number"
        min={field.min}
        max={field.max}
        step={field.step}
        value={numericValue}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] outline-none transition focus:border-brand-300/60"
      />
    );
  }

  const checked = value === true;
  return fieldShell(
    field,
    <label className="flex items-center gap-3 rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-[color:var(--app-border)] bg-transparent"
      />
      <span>{checked ? field.trueLabel ?? "Enabled" : field.falseLabel ?? "Disabled"}</span>
    </label>
  );
}
