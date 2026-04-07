"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { StagePanel } from "@/components/scene/StagePanel";
import { StatusPill } from "@/components/primitives/StatusPill";
import { ChoiceRenderer } from "@/components/runtime/renderers/ChoiceRenderer";
import { FillBlankRenderer } from "@/components/runtime/renderers/FillBlankRenderer";
import { MatchingRenderer } from "@/components/runtime/renderers/MatchingRenderer";
import { OrderingRenderer } from "@/components/runtime/renderers/OrderingRenderer";
import {
  StructuredPromptBlocks,
  StructuredPromptContent
} from "@/components/runtime/renderers/StructuredPromptContent";
import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";

interface QuestionRuntimeCardProps {
  question: any;
  answer: any;
  onChange: (value: any) => void;
  questionIndex?: number;
  questionCount?: number;
}

const formatLabel: Record<string, string> = {
  single_select: "Single select",
  multi_select: "Multi select",
  ordering: "Ordering",
  matching: "Matching",
  fill_blank_constrained: "Fill in the blank",
  log_analysis_single_select: "Log analysis",
  trace_execution: "Trace execution",
  best_next_step: "Best next step",
  case_triage: "Case triage",
  practical_task: "Practical task",
  logic_reasoning: "Logic reasoning"
};

const formatHint: Record<string, string> = {
  single_select: "Choose the one best answer.",
  multi_select: "Select all options that are correct.",
  ordering: "Arrange the items in the safest working order.",
  matching: "Match each item once.",
  fill_blank_constrained: "Pick the most precise completion.",
  log_analysis_single_select: "Base your answer on the log evidence only.",
  trace_execution: "Follow the sequence and pick the final outcome.",
  best_next_step: "Choose the highest-impact next action.",
  case_triage: "Prioritize the first action that reduces risk.",
  practical_task: "Complete each subtask carefully. This exam is auto-graded.",
  logic_reasoning: "Work through each subtask and answer the full set before moving on."
};

const PracticalTaskRenderer = dynamic(() =>
  import("@/components/runtime/renderers/PracticalTaskRenderer").then((mod) => mod.PracticalTaskRenderer)
) as ComponentType<BaseQuestionRendererProps>;

const LogicReasoningRenderer = dynamic(() =>
  import("@/components/runtime/renderers/LogicReasoningRenderer").then((mod) => mod.LogicReasoningRenderer)
) as ComponentType<BaseQuestionRendererProps>;

const MultiChoiceRenderer = (props: BaseQuestionRendererProps) => (
  <ChoiceRenderer {...props} multiple={true} />
);

const rendererRegistry: Record<string, ComponentType<BaseQuestionRendererProps>> = {
  single_select: ChoiceRenderer,
  multi_select: MultiChoiceRenderer,
  ordering: OrderingRenderer,
  matching: MatchingRenderer,
  fill_blank_constrained: FillBlankRenderer,
  log_analysis_single_select: ChoiceRenderer,
  trace_execution: ChoiceRenderer,
  best_next_step: ChoiceRenderer,
  case_triage: ChoiceRenderer,
  practical_task: PracticalTaskRenderer,
  logic_reasoning: LogicReasoningRenderer
};

export function QuestionRuntimeCard({
  question,
  answer,
  onChange,
  questionIndex,
  questionCount
}: QuestionRuntimeCardProps) {
  const formatKey = String(question?.format || "");
  const Renderer = rendererRegistry[formatKey];

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
          <StatusPill label={formatLabel[question.format] || question.format} tone="neutral" />
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
          {formatHint[question.format] || "Answer carefully and move to the next question."}
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
