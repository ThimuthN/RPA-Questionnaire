import { z } from "zod";
import { addonAssessmentTypeIdSchema } from "@/lib/addons/assessment-types";

export const addonUpsertSchema = z.object({
  label: z.string().min(2),
  description: z.string().default(""),
  assessmentTypeId: addonAssessmentTypeIdSchema,
  defaultConfig: z.record(z.string(), z.unknown()).default({}),
  defaultDurationMinutes: z.number().int().positive(),
  defaultRequiredPercent: z.number().int().min(0).max(100),
  defaultWeight: z.number().int().min(0).max(100),
  isActive: z.boolean().optional(),
  // Ownership: null/omitted = global. Otherwise the owning department. sharedDepartmentIds = extra depts allowed to see it.
  departmentId: z.string().nullish(),
  sharedDepartmentIds: z.array(z.string()).optional()
});

export type AddonUpsertInput = z.infer<typeof addonUpsertSchema>;
