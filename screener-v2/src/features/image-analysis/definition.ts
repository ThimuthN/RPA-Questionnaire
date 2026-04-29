import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import { buildImageAnalysisQuestions } from "@/features/image-analysis/questions";

export const imageAnalysisAddonDefinition = {
  id: "ba_iq_test_1st_screening",
  label: "BA IQ Test | 1st Screening",
  description:
    "A business analysis screening module that uses scanned diagrams and workflow visuals to test visual risk diagnosis, process reasoning, and remediation judgment.",
  accentTone: "purple",
  scoreBarClass: "bg-[linear-gradient(90deg,rgba(148,93,255,0.95),rgba(188,148,255,0.88))]",
  panelClass:
    "border-purple-400/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--pill-purple-bg)_90%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]",
  configFields: [],
  defaultWeight: 100,
  defaultConfig: {},
  libraryEntries: [
    {
      seedKey: "addon-ba-iq-test-1st-screening",
      slug: "ba-iq-test-1st-screening",
      label: "BA IQ Test | 1st Screening",
      description:
        "A 30-question BA screening test that asks candidates to analyse scanned diagrams and workflow visuals, identify risks, and choose the safest next action.",
      defaultDurationMinutes: 45,
      defaultRequiredPercent: 65,
      defaultWeight: 100,
      isActive: true,
      sortOrder: 12
    }
  ],
  buildDurationMinutes: () => 45,
  buildConfigSummary: () => "BA IQ Test | 1st Screening",
  buildRequiredPercent: (config, fallbackPassPercent) => Math.max(fallbackPassPercent, 65),
  resolveItems: () => buildImageAnalysisQuestions()
} satisfies AddonDefinitionRegistration;
