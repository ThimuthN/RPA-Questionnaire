import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import { applicantIntakeQuestion } from "@/features/applicant-intake-questionnaire/questions";

export const applicantIntakeQuestionnaireDefinition = {
  id: "applicant_intake_questionnaire",
  label: "Applicant Intake Questionnaire",
  description:
    "Reusable applicant intake questionnaire for eligibility, shift comfort, compensation expectations, location, and work arrangement preferences.",
  accentTone: "teal",
  scoreBarClass: "bg-[linear-gradient(90deg,rgba(20,184,166,0.95),rgba(45,212,191,0.88))]",
  panelClass:
    "border-teal-400/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--pill-teal-bg)_90%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]",
  configFields: [],
  defaultWeight: 1,
  defaultConfig: {},
  libraryEntries: [
    {
      seedKey: "addon-applicant-intake-questionnaire-default",
      slug: "applicant-intake-questionnaire",
      label: "Applicant Intake Questionnaire",
      defaultDurationMinutes: 5,
      defaultRequiredPercent: 100,
      defaultWeight: 1,
      isActive: true,
      sortOrder: 13
    }
  ],
  buildDurationMinutes: (_config: Record<string, unknown>) => 5,
  buildConfigSummary: (_config: Record<string, unknown>) => "Eligibility, compensation, location & arrangement preferences",
  buildRequiredPercent: (_config: Record<string, unknown>, _fallback: number) => 100,
  resolveItems: (_config: Record<string, unknown>) => [applicantIntakeQuestion]
} satisfies AddonDefinitionRegistration;
