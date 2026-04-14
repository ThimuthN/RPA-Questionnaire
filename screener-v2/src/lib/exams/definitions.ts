import { z } from "zod";
import { addonDefinitionIds } from "@/lib/addons/definitions";

export const examDefinitionIds = addonDefinitionIds;

export type ExamDefinitionId = (typeof examDefinitionIds)[number];

export const examDefinitionIdSchema = z.enum(examDefinitionIds);
