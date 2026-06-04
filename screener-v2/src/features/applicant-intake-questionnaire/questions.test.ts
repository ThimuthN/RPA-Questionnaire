import { describe, expect, it } from "vitest";
import { applicantIntakeQuestion } from "@/features/applicant-intake-questionnaire/questions";
import { questionnaireFormDef } from "@/lib/question-types/questionnaire-form";

const REQUIRED_FIELD_IDS = [
  "workEligibility",
  "nightShiftComfort",
  "salaryExpectation",
  "noticePeriod",
  "currentLocation",
  "workArrangementComfort"
];

const COMPLETE_ANSWER = {
  workEligibility: true,
  nightShiftComfort: false,
  salaryExpectation: { currency: "LKR", amount: 150000, period: "monthly" },
  noticePeriod: "2 weeks",
  currentLocation: "Colombo, Sri Lanka",
  workArrangementComfort: "hybrid",
  additionalNotes: ""
};

describe("applicant intake question fields", () => {
  it("has exactly 7 fields", () => {
    expect(applicantIntakeQuestion.fields).toHaveLength(7);
  });

  it("has the correct required field ids", () => {
    const required = applicantIntakeQuestion.fields
      .filter((f) => f.required)
      .map((f) => f.id);
    expect(required).toEqual(REQUIRED_FIELD_IDS);
  });

  it("additionalNotes is optional", () => {
    const notes = applicantIntakeQuestion.fields.find((f) => f.id === "additionalNotes");
    expect(notes?.required).toBe(false);
  });

  it("workArrangementComfort has 4 options", () => {
    const field = applicantIntakeQuestion.fields.find((f) => f.id === "workArrangementComfort");
    expect(field?.options).toHaveLength(4);
    const values = field?.options?.map((o) => o.value);
    expect(values).toEqual(["remote", "hybrid", "onsite", "flexible"]);
  });

  it("salaryExpectation is currency_amount type", () => {
    const field = applicantIntakeQuestion.fields.find((f) => f.id === "salaryExpectation");
    expect(field?.type).toBe("currency_amount");
  });
});

describe("questionnaire_form validateAnswer", () => {
  it("accepts a fully complete answer", () => {
    const result = questionnaireFormDef.validateAnswer(applicantIntakeQuestion, COMPLETE_ANSWER);
    expect(result.ok).toBe(true);
  });

  it("rejects missing required text field", () => {
    const answer = { ...COMPLETE_ANSWER, noticePeriod: "" };
    const result = questionnaireFormDef.validateAnswer(applicantIntakeQuestion, answer);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("notice period");
  });

  it("rejects missing yes_no field (undefined)", () => {
    const { workEligibility: _, ...rest } = COMPLETE_ANSWER;
    const result = questionnaireFormDef.validateAnswer(applicantIntakeQuestion, rest);
    expect(result.ok).toBe(false);
  });

  it("accepts false as a valid yes_no answer", () => {
    const answer = { ...COMPLETE_ANSWER, workEligibility: false };
    const result = questionnaireFormDef.validateAnswer(applicantIntakeQuestion, answer);
    expect(result.ok).toBe(true);
  });

  it("rejects incomplete currency_amount — missing currency", () => {
    const answer = {
      ...COMPLETE_ANSWER,
      salaryExpectation: { amount: 5000, period: "monthly" }
    };
    const result = questionnaireFormDef.validateAnswer(applicantIntakeQuestion, answer);
    expect(result.ok).toBe(false);
  });

  it("rejects invalid currency value", () => {
    const answer = {
      ...COMPLETE_ANSWER,
      salaryExpectation: { currency: "EUR", amount: 5000, period: "monthly" }
    };
    const result = questionnaireFormDef.validateAnswer(applicantIntakeQuestion, answer);
    expect(result.ok).toBe(false);
  });

  it("accepts USD and INR as valid currencies", () => {
    const usd = {
      ...COMPLETE_ANSWER,
      salaryExpectation: { currency: "USD", amount: 120000, period: "annual" }
    };
    expect(questionnaireFormDef.validateAnswer(applicantIntakeQuestion, usd).ok).toBe(true);

    const inr = {
      ...COMPLETE_ANSWER,
      salaryExpectation: { currency: "INR", amount: 1200000, period: "annual" }
    };
    expect(questionnaireFormDef.validateAnswer(applicantIntakeQuestion, inr).ok).toBe(true);
  });

  it("rejects negative amount", () => {
    const answer = {
      ...COMPLETE_ANSWER,
      salaryExpectation: { currency: "USD", amount: -1, period: "hourly" }
    };
    expect(questionnaireFormDef.validateAnswer(applicantIntakeQuestion, answer).ok).toBe(false);
  });
});

describe("questionnaire_form score", () => {
  it("returns normalized 1 for a complete answer", () => {
    const result = questionnaireFormDef.score(applicantIntakeQuestion, COMPLETE_ANSWER);
    expect(result.normalized).toBe(1);
    expect(result.isCorrect).toBe(true);
    expect(result.pointsEarned).toBe(applicantIntakeQuestion.points);
  });

  it("returns normalized 0 for an incomplete answer", () => {
    const result = questionnaireFormDef.score(applicantIntakeQuestion, {});
    expect(result.normalized).toBe(0);
    expect(result.isCorrect).toBe(false);
    expect(result.pointsEarned).toBe(0);
  });

  it("scores as complete even when optional field is empty", () => {
    const answer = { ...COMPLETE_ANSWER, additionalNotes: "" };
    const result = questionnaireFormDef.score(applicantIntakeQuestion, answer);
    expect(result.normalized).toBe(1);
  });
});

describe("questionnaire_form toReviewModel", () => {
  it("produces one line per field", () => {
    const review = questionnaireFormDef.toReviewModel(applicantIntakeQuestion, COMPLETE_ANSWER);
    expect(review.lines).toHaveLength(applicantIntakeQuestion.fields.length);
  });

  it("formats currency_amount as currency amount / period", () => {
    const review = questionnaireFormDef.toReviewModel(applicantIntakeQuestion, COMPLETE_ANSWER);
    const salaryLine = review.lines.find((line) => line.includes("compensation"));
    expect(salaryLine).toContain("LKR");
    expect(salaryLine).toContain("monthly");
  });

  it("formats yes_no as Yes or No", () => {
    const review = questionnaireFormDef.toReviewModel(applicantIntakeQuestion, COMPLETE_ANSWER);
    const eligibilityLine = review.lines.find((line) => line.includes("eligible"));
    expect(eligibilityLine).toContain("Yes");
    const nightShiftLine = review.lines.find((line) => line.includes("night shift"));
    expect(nightShiftLine).toContain("No");
  });

  it("marks optional fields with (optional)", () => {
    const review = questionnaireFormDef.toReviewModel(applicantIntakeQuestion, COMPLETE_ANSWER);
    const notesLine = review.lines.find((line) => line.includes("hiring team should know"));
    expect(notesLine).toContain("(optional)");
  });

  it("shows dash for unanswered optional field", () => {
    const review = questionnaireFormDef.toReviewModel(applicantIntakeQuestion, {
      ...COMPLETE_ANSWER,
      additionalNotes: undefined
    });
    const notesLine = review.lines.find((line) => line.includes("hiring team should know"));
    expect(notesLine).toContain("—");
  });
});
