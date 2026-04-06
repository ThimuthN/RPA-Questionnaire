import type { ReactNode } from "react";
import type { CandidateUiStatus } from "@/lib/candidates/types";
import type { ButtonProps } from "@/components/primitives/Button";

type ResultDecisionActionStatus = Extract<CandidateUiStatus, "moved_forward" | "need_review" | "rejected">;

export type ResultDecisionAction = {
  status: ResultDecisionActionStatus;
  label: string;
  buttonVariant: ButtonProps["variant"];
  barButtonClassName: string;
};

const resultDecisionActions: readonly ResultDecisionAction[] = [
  {
    status: "moved_forward",
    label: "Move forward",
    buttonVariant: "primary",
    barButtonClassName:
      "rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/25"
  },
  {
    status: "need_review",
    label: "Keep in review",
    buttonVariant: "secondary",
    barButtonClassName:
      "rounded-full border border-amber-400/30 bg-amber-500/15 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-500/25"
  },
  {
    status: "rejected",
    label: "Reject",
    buttonVariant: "secondary",
    barButtonClassName:
      "rounded-full border border-red-400/30 bg-red-500/15 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/25"
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
    <form key={action.status} action="/api/results/bulk" method="post">
      <input type="hidden" name="returnTo" value={resultDetailReturnPath(attemptId)} />
      <input type="hidden" name="action" value="set_ui_status" />
      <input type="hidden" name="status" value={action.status} />
      <input type="hidden" name="attemptId" value={attemptId} />
      {renderAction(action)}
    </form>
  ));
}
