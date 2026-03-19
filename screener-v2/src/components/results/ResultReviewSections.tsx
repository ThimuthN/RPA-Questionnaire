import { StagePanel } from "@/components/scene/StagePanel";
import { StatusPill } from "@/components/primitives/StatusPill";
import {
  StructuredPromptBlocks,
  StructuredPromptContent
} from "@/components/runtime/renderers/StructuredPromptContent";
import type { ResultReviewItem, ResultReviewSection } from "@/lib/assessment-engine/types";

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
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <div className="mt-3 space-y-2">
        {(lines.length > 0 ? lines : ["No answer recorded."]).map((line) => (
          <div
            key={`${title}-${line}`}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-slate-100"
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResultReviewSections({ sections }: { sections: ResultReviewSection[] }) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <StagePanel key={section.id} className="space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={section.label} tone="blue" />
                <StatusPill label={`${section.items.length} items`} tone="neutral" />
                {section.configSummary ? <StatusPill label={section.configSummary} tone="neutral" className="normal-case tracking-normal" /> : null}
              </div>
            <h2 className="text-2xl text-white">{section.label} Review</h2>
            {section.description ? (
              <StructuredPromptContent text={section.description} className="space-y-4" />
            ) : null}
          </div>

          <div className="space-y-4">
            {section.items.map((item) => {
              const status = statusMeta(item.status);
              return (
                <div
                  key={item.id}
                  className="rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill label={status.label} tone={status.tone} />
                        <StatusPill label={item.formatLabel} tone="neutral" />
                        {item.category ? <StatusPill label={item.category} tone="neutral" className="normal-case tracking-normal" /> : null}
                        <StatusPill label={`${item.pointsEarned}/${item.pointsPossible} pts`} tone="neutral" className="normal-case tracking-normal" />
                      </div>
                      <h3 className="text-xl text-white">{item.title}</h3>
                      {item.promptBlocks && item.promptBlocks.length > 0 ? (
                        <StructuredPromptBlocks blocks={item.promptBlocks} className="space-y-4" />
                      ) : item.prompt ? (
                        <StructuredPromptContent text={item.prompt} className="space-y-4" />
                      ) : null}
                      {item.logSnippet ? (
                        <pre className="overflow-auto rounded-[18px] border border-white/10 bg-black/55 p-4 text-xs leading-6 text-blue-100">
                          <code>{item.logSnippet}</code>
                        </pre>
                      ) : null}
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                      <AnswerBlock title="Candidate Answer" lines={item.candidateAnswerLines} tone="blue" />
                      <AnswerBlock title="Expected Answer" lines={item.expectedAnswerLines} tone="emerald" />
                    </div>

                    {item.explanation ? (
                      <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Explanation</p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">{item.explanation}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </StagePanel>
      ))}
    </div>
  );
}
