import type { QuestionnaireFormQuestion } from "@/lib/assessment-engine/types";

const WORK_ELIGIBILITY_ID = "intake-q-001";

export const applicantIntakeQuestion: QuestionnaireFormQuestion = {
  id: WORK_ELIGIBILITY_ID,
  format: "questionnaire_form",
  prompt: "Please answer the following questions so the hiring team can better understand your eligibility and preferences.",
  points: 1,
  fields: [
    {
      id: "workEligibility",
      label: "Are you legally eligible to work for this role?",
      type: "yes_no",
      required: true
    },
    {
      id: "nightShiftComfort",
      label: "Are you comfortable working night shifts if required?",
      type: "yes_no",
      required: true
    },
    {
      id: "salaryExpectation",
      label: "What is your expected compensation?",
      type: "currency_amount",
      required: true
    },
    {
      id: "noticePeriod",
      label: "What is your notice period or earliest start date?",
      type: "text",
      placeholder: "Example: Immediate, 2 weeks, 30 days",
      required: true
    },
    {
      id: "currentLocation",
      label: "What is your current location?",
      type: "text",
      placeholder: "City, country",
      required: true
    },
    {
      id: "workArrangementComfort",
      label: "Which work arrangement are you comfortable with?",
      type: "single_select",
      required: true,
      options: [
        { value: "remote", label: "Remote" },
        { value: "hybrid", label: "Hybrid" },
        { value: "onsite", label: "On-site" },
        { value: "flexible", label: "Flexible" }
      ]
    },
    {
      id: "additionalNotes",
      label: "Anything else the hiring team should know?",
      type: "text",
      placeholder: "Optional — add any context you think is relevant.",
      required: false
    }
  ]
};
