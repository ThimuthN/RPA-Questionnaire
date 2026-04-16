import { StagePanel } from "@/components/scene/StagePanel";
import { StatusPill } from "@/components/primitives/StatusPill";
import {
  StructuredPromptBlocks,
  StructuredPromptContent
} from "@/components/runtime/renderers/StructuredPromptContent";
import type {
  ExamBreakdown,
  ResultReviewItem,
  ResultReviewSection
} from "@/lib/assessment-engine/types";

function statusMeta(status: ResultReviewItem["status"]) {
  switch (status) {
    case "correct":
      return { label: "Correct", tone: "emerald" as const };
    case "partial":
      return { label: "Partial", tone: "amber" as const };
    case "incorrect":
      return { label: "Incorrect", tone: "red" as const };
    default:
      return { label: "Unanswered", tone: "neutral" as const };
  }
}

function itemPreview(item: ResultReviewItem, mode: "result" | "answer_key") {
  const candidatePreview = item.candidateAnswerLines.find((line) => line.trim().length > 0);
  const expectedPreview = item.expectedAnswerLines.find((line) => line.trim().length > 0);

  if (mode === "result") {
    return candidatePreview || expectedPreview || "Open this item to review the full answer.";
  }

  return expectedPreview || "Open this item to review the answer key.";
}

function openByDefault(item: ResultReviewItem, mode: "result" | "answer_key") {
  if (mode === "answer_key") {
    return false;
  }

  return item.status !== "correct";
}

function AnswerBlock({
  title,
  lines,
  tone
}: {
  title: string;
  lines: string[];
  tone: "blue" | "emerald";
}) {
  return (
    <div
      className={`rounded-[18px] border p-4 ${
        tone === "blue"
          ? "border-brand-300/20 bg-brand-500/10"
          : "border-emerald-400/20 bg-emerald-500/10"
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{title}</p>
      <div className="mt-3 space-y-2">
        {(lines.length > 0 ? lines : ["No answer recorded."]).map((line) => (
          <div
            key={`${title}-${line}`}
            className="rounded-xl border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] px-3 py-2 text-sm leading-6 text-[color:var(--app-text)]"
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResultReviewSections({
  sections,
  examBreakdown,
  mode = "result"
}: {
  sections: ResultReviewSection[];
  examBreakdown?: ExamBreakdown;
  mode?: "result" | "answer_key";
}) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const exam = examBreakdown?.[section.id];
        return (
          <StagePanel key={section.id} className="space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={exam ? `#${exam.order + 1}` : section.label} tone="neutral" />
                <StatusPill label={section.label} tone="blue" />
                <StatusPill label={`${section.items.length} items`} tone="neutral" />
                {section.configSummary ? (
                  <StatusPill
                    label={section.configSummary}
                    tone="neutral"
                    className="normal-case tracking-normal"
                  />
                ) : null}
              </div>
              <h2 className="text-2xl text-[color:var(--app-heading)]">
                {section.label} {mode === "result" ? "Review" : "Answer Key"}
              </h2>
              {section.description ? (
                <StructuredPromptContent text={section.description} className="space-y-4" />
              ) : null}
            </div>

            <div className="space-y-4">
              {section.items.map((item) => {
                const status = statusMeta(item.status);
                return (
                  <details
                    key={item.id}
                    open={openByDefault(item, mode)}
                    className="group rounded-[20px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] px-4 py-4"
                  >
                    <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {mode === "result" ? (
                              <StatusPill label={status.label} tone={status.tone} />
                            ) : null}
                            <StatusPill label={item.formatLabel} tone="neutral" />
                            {item.category ? (
                              <StatusPill
                                label={item.category}
                                tone="neutral"
                                className="normal-case tracking-normal"
                              />
                            ) : null}
                            {mode === "result" ? (
                              <StatusPill
                                label={`${item.pointsEarned}/${item.pointsPossible} pts`}
                                tone="neutral"
                                className="normal-case tracking-normal"
                              />
                            ) : null}
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xl text-[color:var(--app-heading)]">{item.title}</h3>
                            <p className="line-clamp-2 text-sm leading-6 text-[color:var(--app-muted)]">
                              {itemPreview(item, mode)}
                            </p>
                          </div>
                        </div>
                        <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] text-[color:var(--app-muted)] transition duration-200 group-open:rotate-180">
                          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                            <path
                              d="M5 7.5L10 12.5L15 7.5"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </div>
                    </summary>

                    <div className="mt-4 space-y-4 border-t border-[color:var(--app-border)] pt-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill label="Question detail" tone="neutral" />
                        </div>
                        {item.promptBlocks && item.promptBlocks.length > 0 ? (
                          <StructuredPromptBlocks blocks={item.promptBlocks} className="space-y-4" />
                        ) : item.prompt ? (
                          <StructuredPromptContent text={item.prompt} className="space-y-4" />
                        ) : null}
                        {item.logSnippet ? (
                          <pre className="overflow-auto rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-muted)] p-4 text-xs leading-6 text-[color:var(--app-text)]">
                            <code>{item.logSnippet}</code>
                          </pre>
                        ) : null}
                      </div>

                      {mode === "result" ? (
                        <div className="grid gap-3 lg:grid-cols-2">
                          <AnswerBlock title="Candidate Answer" lines={item.candidateAnswerLines} tone="blue" />
                          <AnswerBlock title="Expected Answer" lines={item.expectedAnswerLines} tone="emerald" />
                        </div>
                      ) : (
                        <AnswerBlock title="Expected Answer" lines={item.expectedAnswerLines} tone="emerald" />
                      )}

                      {item.explanation ? (
                        <div className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted)]">Explanation</p>
                          <p className="mt-2 text-sm leading-6 text-[color:var(--app-text)]">{item.explanation}</p>
                        </div>
                      ) : null}
                    </div>
                  </details>
                );
              })}
            </div>
          </StagePanel>
        );
      })}
    </div>
  );
}
