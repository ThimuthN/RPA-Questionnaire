"use client";

import { Info } from "lucide-react";

export function InfoTooltip({
  content,
  size = 13,
}: {
  content: string;
  size?: number;
}) {
  return (
    <span className="group relative inline-flex shrink-0 cursor-help items-center">
      <Info
        size={size}
        className="text-[color:var(--app-muted)] transition-colors duration-150 group-hover:text-[color:var(--app-heading)]"
      />
      <span
        role="tooltip"
        className={[
          "pointer-events-none absolute bottom-full left-1/2 z-[200] mb-2 -translate-x-1/2",
          "w-64 rounded-[14px] border border-[color:var(--app-border)]",
          "bg-[color:var(--app-surface)] px-3.5 py-2.5",
          "text-xs leading-relaxed text-[color:var(--app-muted)]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.28)]",
          "opacity-0 transition-opacity duration-150 group-hover:opacity-100",
          // keep inside viewport when near left/right edges
          "before:absolute before:bottom-[-1px] before:left-1/2 before:h-px before:w-0",
        ].join(" ")}
      >
        {content}
      </span>
    </span>
  );
}
