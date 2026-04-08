import { z } from "zod";

export const examDefinitionIds = [
  "core_exam",
  "core_2_exam",
  "rpa_runtime_exam",
  "practical_exam",
  "applied_logic_exam",
  "general_capability_exam",
  "business_analysis_exam",
  "rcm_exam"
] as const;

export type ExamDefinitionId = (typeof examDefinitionIds)[number];

export const examDefinitionIdSchema = z.enum(examDefinitionIds);
