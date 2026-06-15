import { ReactNode } from "react";

export type BannerTone = "success" | "error" | "warning" | "info";

function getToneStyles(tone: BannerTone): string {
  const base = "rounded-[20px] border p-4 text-sm";
  switch (tone) {
    case "success":
      return `${base} border-[color:var(--app-success)]/30 bg-[color:var(--app-success-soft)] text-[color:var(--app-success)]`;
    case "error":
      return `${base} border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] text-[color:var(--app-danger)]`;
    case "warning":
      return `${base} border-[color:var(--app-warning)]/30 bg-[color:var(--app-warning-soft)] text-[color:var(--app-warning)]`;
    case "info":
      return `${base} border-[color:var(--app-primary)]/30 bg-[color:var(--app-primary)]/10 text-[color:var(--app-primary)]`;
    default:
      return `${base} border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-muted)]`;
  }
}

export function NotificationBanner({
  tone,
  children
}: {
  tone: BannerTone;
  children: ReactNode;
}) {
  return (
    <div className={getToneStyles(tone)} role="alert">
      {children}
    </div>
  );
}
