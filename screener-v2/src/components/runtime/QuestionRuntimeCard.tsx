"use client";

import { StagePanel } from "@/components/scene/StagePanel";
import { StatusPill } from "@/components/primitives/StatusPill";
import { getQuestionRuntimeFormatDefinition } from "@/components/runtime/renderers/registry";
import {
  StructuredPromptBlocks,
  StructuredPromptContent
} from "@/components/runtime/renderers/StructuredPromptContent";

interface QuestionRuntimeCardProps {
  question: any;
  answer: any;
  onChange: (value: any) => void;
  questionIndex?: number;
  questionCount?: number;
}

export function QuestionRuntimeCard({
  question,
  answer,
  onChange,
  questionIndex,
  questionCount
}: QuestionRuntimeCardProps) {
  const formatKey = String(question?.format || "");
  const formatDefinition = getQuestionRuntimeFormatDefinition(question?.format);
  const Renderer = formatDefinition?.Renderer;

  if (!Renderer) {
    return (
      <StagePanel>
        <p className="text-[color:var(--app-danger)]">Unsupported question format: {String(question.format)}</p>
      </StagePanel>
    );
  }

  const prompt = String(question?.prompt ?? "").replace(/\r\n/g, "\n").trim();
  const promptLines = prompt.split("\n").map((line: string) => line.trim()).filter(Boolean);
  const isStructuredPromptFormat = question.format === "matching" || question.format === "ordering";
  const promptTitle = promptLines[0] ?? prompt;
  const promptBody =
    !isStructuredPromptFormat && promptLines.length > 1
      ? prompt.slice(promptTitle.length).trim()
      : "";

  return (
    <StagePanel className="space-y-5 border-[color:var(--app-border-strong)] bg-[linear-gradient(180deg,var(--app-control-bg-strong),var(--app-surface-soft))]">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={formatDefinition?.label || question.format} tone="neutral" />
          {typeof questionIndex === "number" && typeof questionCount === "number" ? (
            <StatusPill
              label={`${questionIndex + 1} of ${questionCount}`}
              tone="neutral"
              className="normal-case tracking-normal"
            />
          ) : null}
        </div>
        <h3 className="max-w-3xl font-display text-2xl leading-tight text-[color:var(--app-heading)]">{promptTitle}</h3>
        {Array.isArray(question.promptBlocks) && question.promptBlocks.length > 0 ? (
          <StructuredPromptBlocks blocks={question.promptBlocks} className="space-y-4" />
        ) : promptBody ? (
          <StructuredPromptContent text={promptBody} className="space-y-4" />
        ) : null}
        <p className="text-sm text-[color:var(--app-text)]">
          {formatDefinition?.hint || "Answer carefully and move to the next question."}
        </p>
        {question.logSnippet ? (
          <pre className="overflow-auto rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4 text-xs leading-6 text-[color:var(--app-text)]">
            <code>{question.logSnippet}</code>
          </pre>
        ) : null}
      </div>
      <Renderer question={question} answer={answer} onChange={onChange} />
    </StagePanel>
  );
}
