"use client";

import type { ComponentType } from "react";
import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";
import type { QuestionFormatId } from "@/lib/assessment-engine/types";
import { questionRegistry } from "@/lib/question-types";

export interface QuestionRuntimeFormatDefinition {
  label: string;
  hint: string;
  Renderer: ComponentType<BaseQuestionRendererProps>;
}

export const questionRuntimeFormatRegistry: Record<QuestionFormatId, QuestionRuntimeFormatDefinition> =
  Object.fromEntries(
    Object.values(questionRegistry).map((definition) => [
      definition.type,
      {
        label: definition.runtimeLabel,
        hint: definition.runtimeHint,
        Renderer: definition.Renderer as ComponentType<BaseQuestionRendererProps>
      }
    ])
  ) as Record<QuestionFormatId, QuestionRuntimeFormatDefinition>;

export const runtimeQuestionFormatIds = Object.keys(questionRuntimeFormatRegistry).sort() as QuestionFormatId[];

export function getQuestionRuntimeFormatDefinition(format: unknown) {
  const formatKey = String(format || "") as QuestionFormatId;
  return questionRuntimeFormatRegistry[formatKey] ?? null;
}
