import { Button } from "@/components/primitives/Button";
import { StagePanel } from "@/components/scene/StagePanel";

export function RuntimeRecoveryModal({
  open,
  title,
  message,
  facts,
  actionLabel,
  onAction
}: {
  open: boolean;
  title: string;
  message: string;
  facts: string[];
  actionLabel: string;
  onAction: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm"
      style={{ background: "var(--app-modal-overlay)" }}
    >
      <StagePanel tone="summary" className="w-full max-w-xl space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Recovery step</p>
        <h3 className="text-2xl text-[color:var(--app-heading)]">{title}</h3>
        <p className="text-sm leading-6 text-[color:var(--app-text)]">{message}</p>
        <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 text-left">
          <ul className="space-y-2 text-sm text-[color:var(--app-text)]">
            {facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      </StagePanel>
    </div>
  );
}
