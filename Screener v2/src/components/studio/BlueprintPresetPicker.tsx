"use client";

import type { RoleId } from "@/lib/assessment-engine/types";

const roles: RoleId[] = ["Intern", "Associate", "SE", "SeniorSE", "TechLead"];

export function BlueprintPresetPicker({
  roleId,
  onRoleChange
}: {
  roleId: RoleId;
  onRoleChange: (role: RoleId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
      {roles.map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => onRoleChange(role)}
          className={`w-full rounded-[18px] border px-4 py-3 text-center text-sm transition duration-200 ${
            roleId === role
              ? "border-brand-400 bg-brand-500/18 text-white shadow-[0_16px_40px_rgba(31,111,255,0.18)]"
              : "border-white/15 bg-white/[0.05] text-slate-200 hover:border-brand-300/50 hover:bg-white/[0.07]"
          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950`}
        >
          {role}
        </button>
      ))}
    </div>
  );
}
