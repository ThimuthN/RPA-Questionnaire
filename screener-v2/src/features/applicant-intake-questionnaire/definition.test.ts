import { describe, expect, it } from "vitest";
import { applicantIntakeQuestionnaireDefinition } from "@/features/applicant-intake-questionnaire/definition";
import { orderedAddonDefinitions } from "@/lib/addons/definitions";

describe("applicantIntakeQuestionnaireDefinition", () => {
  it("has the correct id", () => {
    expect(applicantIntakeQuestionnaireDefinition.id).toBe("applicant_intake_questionnaire");
  });

  it("resolves exactly one questionnaire_form question from empty config", () => {
    const items = applicantIntakeQuestionnaireDefinition.resolveItems({});
    expect(items).toHaveLength(1);
    expect(items[0].format).toBe("questionnaire_form");
  });

  it("resolves 7 fields in the questionnaire item", () => {
    const items = applicantIntakeQuestionnaireDefinition.resolveItems({});
    const question = items[0] as { fields?: unknown[] };
    expect(question.fields).toHaveLength(7);
  });

  it("returns 5 minute duration", () => {
    expect(applicantIntakeQuestionnaireDefinition.buildDurationMinutes({})).toBe(5);
  });

  it("returns 100 required percent", () => {
    expect(applicantIntakeQuestionnaireDefinition.buildRequiredPercent({}, 60)).toBe(100);
  });

  it("has defaultWeight of 1", () => {
    expect(applicantIntakeQuestionnaireDefinition.defaultWeight).toBe(1);
  });

  it("has a library entry with sortOrder 13", () => {
    expect(applicantIntakeQuestionnaireDefinition.libraryEntries).toHaveLength(1);
    expect(applicantIntakeQuestionnaireDefinition.libraryEntries[0].sortOrder).toBe(13);
    expect(applicantIntakeQuestionnaireDefinition.libraryEntries[0].slug).toBe(
      "applicant-intake-questionnaire"
    );
  });

  it("is included in orderedAddonDefinitions", () => {
    const ids = orderedAddonDefinitions.map((d) => d.id);
    expect(ids).toContain("applicant_intake_questionnaire");
  });
});
