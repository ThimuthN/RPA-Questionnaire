import { ReactNode } from "react";

export type BannerTone = "success" | "error" | "warning" | "info";

function getToneStyles(tone: BannerTone): string {
  switch (tone) {
    case "success":
      return "rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100";
    case "error":
      return "rounded-[20px] border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100";
    case "warning":
      return "rounded-[20px] border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100";
    case "info":
      return "rounded-[20px] border border-blue-400/30 bg-blue-500/10 p-4 text-sm text-blue-100";
    default:
      return "rounded-[20px] border border-slate-400/30 bg-slate-500/10 p-4 text-sm text-slate-100";
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
