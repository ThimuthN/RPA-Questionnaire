"use client";

import type { IntegrityPresetId } from "@/lib/assessment-engine/types";
import {
  integrityPresetIds,
  integrityPresetMeta
} from "@/lib/integrity/policy";

export function IntegrityPresetPicker({
  value,
  onChange,
  label = "Integrity controls",
  description = "Choose how protective the runtime should feel for candidates."
}: {
  value: IntegrityPresetId;
  onChange: (value: IntegrityPresetId) => void;
  label?: string;
  description?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm text-[color:var(--app-heading)]">{label}</p>
        <p className="text-xs text-[color:var(--app-muted)]">{description}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {integrityPresetIds.map((presetId) => {
          const meta = integrityPresetMeta[presetId];
          const active = value === presetId;
          return (
            <button
              key={presetId}
              type="button"
              onClick={() => onChange(presetId)}
              className={`rounded-[20px] border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 ${
                active
                  ? "border-brand-300/60 bg-[color:var(--app-brand-soft)] text-[color:var(--app-brand)] shadow-[0_16px_36px_color-mix(in_srgb,var(--app-brand)_14%,transparent)]"
                  : "border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-text)] hover:border-brand-300/40 hover:bg-[color:var(--app-surface-muted)]"
              }`}
            >
              <p className={`text-sm ${active ? "text-[color:var(--app-heading)]" : "text-[color:var(--app-heading)]"}`}>
                {meta.shortLabel}
              </p>
              <p
                className={`mt-2 text-xs leading-5 ${
                  active ? "text-[color:var(--app-text)]" : "text-[color:var(--app-muted)]"
                }`}
              >
                {meta.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
