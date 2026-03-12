import type { ReactNode } from "react";
import { StagePanel } from "@/components/scene/StagePanel";

export function DecisionStage({
  hero,
  signals,
  children
}: {
  hero: ReactNode;
  signals: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-5">
      {hero}
      <div className="grid gap-3 md:grid-cols-3">{signals}</div>
      {children ? <StagePanel className="space-y-4">{children}</StagePanel> : null}
    </div>
  );
}
