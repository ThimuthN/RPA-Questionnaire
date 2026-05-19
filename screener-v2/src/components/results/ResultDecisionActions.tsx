import type { ReactNode } from "react";
import type { CandidateStage } from "@/lib/candidates/types";
import type { ButtonProps } from "@/components/primitives/Button";

type ResultDecisionActionStage = Extract<CandidateStage, "decision" | "screening" | "closed">;

export type ResultDecisionAction = {
  stage: ResultDecisionActionStage;
  label: string;
  buttonVariant: ButtonProps["variant"];
  barButtonClassName: string;
};

const resultDecisionActions: readonly ResultDecisionAction[] = [
  {
    stage: "decision",
    label: "Move forward",
    buttonVariant: "primary",
    barButtonClassName:
      "rounded-full border border-[color:var(--app-success)]/30 bg-[color:var(--app-success-soft)] px-4 py-2 text-sm text-[color:var(--app-success)] transition hover:brightness-95"
  },
  {
    stage: "screening",
    label: "Keep in review",
    buttonVariant: "secondary",
    barButtonClassName:
      "rounded-full border border-[color:var(--app-warning)]/30 bg-[color:var(--app-warning-soft)] px-4 py-2 text-sm text-[color:var(--app-warning)] transition hover:brightness-95"
  },
  {
    stage: "closed",
    label: "Reject",
    buttonVariant: "secondary",
    barButtonClassName:
      "rounded-full border border-[color:var(--app-danger)]/30 bg-[color:var(--app-danger-soft)] px-4 py-2 text-sm text-[color:var(--app-danger)] transition hover:brightness-95"
  }
];

function resultDetailReturnPath(attemptId: string) {
  return `/results/${attemptId}`;
}

export function ResultDecisionActions({
  attemptId,
  renderAction
}: {
  attemptId: string;
  renderAction: (action: ResultDecisionAction) => ReactNode;
}) {
  return resultDecisionActions.map((action) => (
    <form key={action.stage} action="/api/results/bulk" method="post">
      <input type="hidden" name="returnTo" value={resultDetailReturnPath(attemptId)} />
      <input type="hidden" name="action" value="set_stage" />
      <input type="hidden" name="stage" value={action.stage} />
      <input type="hidden" name="attemptId" value={attemptId} />
      {renderAction(action)}
    </form>
  ));
}
