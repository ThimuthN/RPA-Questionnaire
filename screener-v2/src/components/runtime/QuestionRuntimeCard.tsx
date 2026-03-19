"use client";

import { questionRegistry } from "@/lib/question-types";
import { StagePanel } from "@/components/scene/StagePanel";
import { StatusPill } from "@/components/primitives/StatusPill";
import {
  StructuredPromptBlocks,
  StructuredPromptContent
} from "@/components/runtime/renderers/StructuredPromptContent";

interface QuestionRuntimeCardProps {
  question: any;
  answer: any;
  onChange: (value: any) => void;
  sectionLabel?: string;
  sectionSummary?: string;
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
  case_triage: "Case triage"
  ,
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
  case_triage: "Prioritize the first action that reduces risk."
  ,
  practical_task: "Complete each subtask carefully. This exam is auto-graded.",
  logic_reasoning: "Work through each subtask and answer the full set before moving on."
};

export function QuestionRuntimeCard({ question, answer, onChange, sectionLabel, sectionSummary }: QuestionRuntimeCardProps) {
  const formatKey = String(question?.format || "") as keyof typeof questionRegistry;
  const def = questionRegistry[formatKey];
  if (!def) {
    return (
      <StagePanel>
        <p className="text-red-200">Unsupported question format: {String(question.format)}</p>
      </StagePanel>
    );
  }
  const Renderer = def.Renderer as any;
  const prompt = String(question?.prompt ?? "").replace(/\r\n/g, "\n").trim();
  const promptLines = prompt.split("\n").map((line: string) => line.trim()).filter(Boolean);
  const isStructuredPromptFormat = question.format === "matching" || question.format === "ordering";
  const promptTitle = promptLines[0] ?? prompt;
  const promptBody =
    !isStructuredPromptFormat && promptLines.length > 1
      ? prompt.slice(promptTitle.length).trim()
      : "";

  return (
    <StagePanel className="space-y-5 border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.07))]">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={sectionLabel || question.category || "Exam"} tone="blue" />
          <StatusPill label={formatLabel[question.format] || question.format} tone="neutral" />
          {sectionSummary ? <StatusPill label={sectionSummary} tone="neutral" className="normal-case tracking-normal" /> : null}
        </div>
        <h3 className="max-w-3xl font-display text-2xl leading-tight text-white">{promptTitle}</h3>
        {Array.isArray(question.promptBlocks) && question.promptBlocks.length > 0 ? (
          <StructuredPromptBlocks blocks={question.promptBlocks} className="space-y-4" />
        ) : promptBody ? (
          <StructuredPromptContent text={promptBody} className="space-y-4" />
        ) : null}
        <p className="text-sm text-slate-300">
          {formatHint[question.format] || "Answer carefully and move to the next question."}
        </p>
        {question.logSnippet ? (
          <pre className="overflow-auto rounded-[18px] border border-white/10 bg-black/55 p-4 text-xs leading-6 text-blue-100">
            <code>{question.logSnippet}</code>
          </pre>
        ) : null}
      </div>
      <Renderer question={question} answer={answer} onChange={onChange} />
    </StagePanel>
  );
}
