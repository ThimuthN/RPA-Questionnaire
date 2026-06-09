import { describe, expect, it } from "vitest";
import { applicantIntakeQuestion } from "@/features/applicant-intake-questionnaire/questions";
import type { ApplicationScreeningPackage } from "@/lib/jobs/types";
import {
  evaluateApplicationScreening,
  resolveApplicationScreeningPackageFromPreset,
  validateApplicationScreeningAnswerMap
} from "@/lib/jobs/application-screening";

const COMPLETE_INTAKE_RESPONSE = {
  workEligibility: true,
  nightShiftComfort: false,
  salaryExpectation: { currency: "LKR", amount: 150000, period: "monthly" },
  noticePeriod: "2 weeks",
  currentLocation: "Colombo, Sri Lanka",
  workArrangementComfort: "hybrid",
  additionalNotes: ""
};

function makePreset() {
  return {
    id: "preset-1",
    label: "Application screening package",
    items: [
      {
        sortOrder: 1,
        addon: {
          id: "addon-2",
          slug: "applicant-intake-questionnaire-copy",
          label: "Applicant Intake Follow-up",
          assessmentTypeId: "applicant_intake_questionnaire",
          defaultConfigJson: {},
          defaultRequiredPercent: 100,
          defaultWeight: 2
        }
      },
      {
        sortOrder: 0,
        addon: {
          id: "addon-1",
          slug: "applicant-intake-questionnaire",
          label: "Applicant Intake Questionnaire",
          assessmentTypeId: "applicant_intake_questionnaire",
          defaultConfigJson: {},
          defaultRequiredPercent: 100,
          defaultWeight: 1
        }
      }
    ]
  };
}

function buildCompleteAnswers(packageState: ApplicationScreeningPackage) {
  return Object.fromEntries(
    packageState.addons.map((addon) => [
      addon.key,
      {
        [applicantIntakeQuestion.id]: COMPLETE_INTAKE_RESPONSE
      }
    ])
  );
}

describe("resolveApplicationScreeningPackageFromPreset", () => {
  it("keeps multiple preset add-ons and resolves inline questionnaire questions", () => {
    const packageState = resolveApplicationScreeningPackageFromPreset(makePreset());

    expect(packageState).not.toBeNull();
    expect(packageState?.presetLabel).toBe("Application screening package");
    expect(packageState?.addons.map((addon) => addon.key)).toEqual([
      "applicant-intake-questionnaire:0",
      "applicant-intake-questionnaire-copy:1"
    ]);
    expect(packageState?.addons.every((addon) => addon.inlineSupported)).toBe(true);
    expect(packageState?.addons[0]?.questions[0]?.format).toBe("questionnaire_form");
  });
});

describe("validateApplicationScreeningAnswerMap", () => {
  it("rejects incomplete required screening answers", () => {
    const packageState = resolveApplicationScreeningPackageFromPreset(makePreset());
    expect(packageState).not.toBeNull();

    const result = validateApplicationScreeningAnswerMap(packageState, {
      "applicant-intake-questionnaire:0": {
        [applicantIntakeQuestion.id]: {
          ...COMPLETE_INTAKE_RESPONSE,
          noticePeriod: ""
        }
      }
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("notice period");
    }
  });
});

describe("evaluateApplicationScreening", () => {
  it("scores inline add-ons and snapshots questionnaire field answers", () => {
    const packageState = resolveApplicationScreeningPackageFromPreset(makePreset());
    expect(packageState).not.toBeNull();

    const evaluation = evaluateApplicationScreening(
      packageState,
      buildCompleteAnswers(packageState as ApplicationScreeningPackage)
    );

    expect(evaluation.overallStatus).toBe("passed");
    expect(evaluation.addonResults).toHaveLength(2);
    expect(evaluation.addonResults[0]).toMatchObject({
      status: "passed",
      applicantPercent: 100,
      requiredPercent: 100
    });
    expect(evaluation.addonResults[0]?.responses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          questionKey: "workEligibility",
          answerJson: true,
          answerText: "Yes"
        }),
        expect.objectContaining({
          questionKey: "salaryExpectation",
          answerJson: {
            currency: "LKR",
            amount: 150000,
            period: "monthly"
          }
        })
      ])
    );
  });

  it("marks unsupported add-ons as needs review", () => {
    const evaluation = evaluateApplicationScreening(
      {
        presetId: "preset-2",
        presetLabel: "Manual package",
        addons: [
          {
            key: "manual-addon:0",
            addonId: "addon-manual",
            addonSlug: "manual-addon",
            addonLabel: "Manual add-on",
            assessmentTypeId: "applicant_intake_questionnaire",
            configSummary: "Needs manual handling",
            durationMinutes: 0,
            requiredPercent: 100,
            weight: 1,
            isMandatory: true,
            inlineSupported: false,
            inlineSupportReason: "Not safe for public application.",
            sortOrder: 0,
            questions: []
          }
        ]
      },
      {}
    );

    expect(evaluation.overallStatus).toBe("needs_review");
    expect(evaluation.addonResults[0]).toMatchObject({
      status: "needs_review",
      inlineSupported: false,
      applicantPercent: null
    });
  });
});
