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
        <p className="text-sm text-slate-100">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
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
                  ? "border-brand-300 bg-brand-500/16 text-white shadow-[0_16px_36px_rgba(31,111,255,0.16)]"
                  : "border-white/12 bg-white/[0.05] text-slate-200 hover:border-brand-300/40 hover:bg-white/[0.08]"
              }`}
            >
              <p className="text-sm text-white">{meta.shortLabel}</p>
              <p className="mt-2 text-xs leading-5 text-slate-300">{meta.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
