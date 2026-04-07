"use client";

import { cn } from "@/lib/utils";

export function ChoicePills({
  name,
  options,
  defaultValue,
  value,
  idPrefix,
  required = false,
  className,
  onChange
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  value?: string;
  idPrefix: string;
  required?: boolean;
  className?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option, index) => {
        const id = `${idPrefix}-${option.value}`;

        return (
          <div key={option.value}>
            <input
              id={id}
              name={name}
              type="radio"
              value={option.value}
              checked={value !== undefined ? value === option.value : undefined}
              defaultChecked={value === undefined ? defaultValue === option.value : undefined}
              required={required && index === 0}
              className="peer sr-only"
              onChange={() => onChange?.(option.value)}
            />
            <label
              htmlFor={id}
              className="inline-flex cursor-pointer items-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-2 text-sm text-[color:var(--app-text)] transition hover:border-[color:var(--app-border-strong)] hover:bg-[color:var(--app-surface-soft)] peer-checked:border-brand-300/60 peer-checked:bg-[color:var(--app-brand-soft)] peer-checked:text-[color:var(--app-brand)] peer-checked:shadow-[0_10px_24px_color-mix(in_srgb,var(--app-brand)_16%,transparent)]"
            >
              {option.label}
            </label>
          </div>
        );
      })}
    </div>
  );
}
