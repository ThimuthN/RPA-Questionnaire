"use client";

import type { ExamConfigFieldDefinition } from "@/lib/assessment-engine/types";

export function ConfigFieldEditor({
  field,
  value,
  onChange
}: {
  field: ExamConfigFieldDefinition;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const selectedValues = Array.isArray(value) ? value.map(String) : [];
  const singleValue = typeof value === "string" ? value : "";

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm text-slate-100">{field.label}</p>
        {field.description ? <p className="text-xs text-slate-400">{field.description}</p> : null}
      </div>
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
                  : "border-white/16 bg-white/[0.05] text-slate-200 hover:border-brand-300/50 hover:bg-white/[0.08]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
