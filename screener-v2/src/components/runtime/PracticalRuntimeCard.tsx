"use client";

import { StagePanel } from "@/components/scene/StagePanel";
import { StatusPill } from "@/components/primitives/StatusPill";
import { practicalTaskDef } from "@/lib/question-types/practical-task";

interface PracticalRuntimeCardProps {
  pack: any;
  answer: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export function PracticalRuntimeCard({ pack, answer, onChange }: PracticalRuntimeCardProps) {
  const Renderer = practicalTaskDef.Renderer as any;
  const question = {
    id: `${pack.id}_practical`,
    prompt: pack.prompt,
    points: pack.subtasks.reduce((sum: number, item: any) => sum + Number(item.points || 0), 0),
    subtasks: pack.subtasks
  };
  return (
    <StagePanel className="space-y-5 border-teal-400/18 bg-[linear-gradient(180deg,rgba(18,179,168,0.12),rgba(255,255,255,0.05))]">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label="Practical" tone="teal" />
          <StatusPill label={`${pack.subtasks.length} subtasks`} tone="neutral" />
        </div>
        <h3 className="font-display text-2xl text-white">{pack.title}</h3>
        <p className="max-w-3xl text-slate-200">{pack.prompt}</p>
        <p className="text-sm text-slate-300">Complete each subtask. This section is auto-graded.</p>
      </div>
      <Renderer question={question} answer={answer} onChange={onChange} />
    </StagePanel>
  );
}
