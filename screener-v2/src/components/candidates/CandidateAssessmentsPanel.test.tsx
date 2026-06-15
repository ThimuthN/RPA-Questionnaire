import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CandidateAssessmentsPanel,
  type CandidateProfilePlatformAssessment
} from "./CandidateAssessmentsPanel";
import type { CandidateApplicationAssessmentRecord } from "@/lib/db/candidates/types";

describe("CandidateAssessmentsPanel", () => {
  it("renders platform assessments and application screening evidence", () => {
    const platformAssessments: CandidateProfilePlatformAssessment[] = [
      {
        id: "assessment-1",
        inviteId: "invite-1",
        inviteSlug: "tech-screen",
        attemptId: "attempt-1",
        createdAt: "2026-06-10T00:00:00.000Z",
        createdById: undefined,
        status: "passed",
        startedAt: "2026-06-10T01:00:00.000Z",
        submittedAt: "2026-06-10T02:00:00.000Z",
        finalPercent: 88,
        pass: true,
        borderline: false,
        title: "Technical Screen",
        resultHref: "/results/attempt-1"
      }
    ];

    const applicationAssessments: CandidateApplicationAssessmentRecord[] = [
      {
        id: "application-1",
        candidateId: "cand-1",
        jobPostingId: "job-1",
        jobSlug: "rpa-engineer",
        jobTitle: "RPA Engineer",
        roleLabel: "RPA Engineer",
        roleDepartment: "Automation",
        status: "submitted",
        screenerPresetLabel: "Applicant Intake Questionnaire",
        screeningStatus: "needs_review",
        screeningAddonResults: [
          {
            addonLabel: "Applicant Intake Questionnaire",
            requiredPercent: 100,
            weight: 1,
            isMandatory: true,
            inlineSupported: true,
            status: "needs_review",
            applicantPercent: 75,
            pointsEarned: 3,
            pointsPossible: 4,
            responses: [
              {
                addonLabel: "Applicant Intake Questionnaire",
                questionKey: "workEligibility",
                questionLabel: "Eligible to work?",
                formatLabel: "Questionnaire",
                answerText: "Yes",
                pointsEarned: 1,
                pointsPossible: 1,
                sortOrder: 0
              }
            ]
          }
        ],
        createdAt: "2026-06-10T00:00:00.000Z",
        updatedAt: "2026-06-10T00:00:00.000Z"
      }
    ];

    const markup = renderToStaticMarkup(
      <CandidateAssessmentsPanel
        candidateId="cand-1"
        platformAssessments={platformAssessments}
        applicationAssessments={applicationAssessments}
        externalAssessments={[]}
      />
    );

    expect(markup).toContain("Platform assessments");
    expect(markup).toContain("Technical Screen");
    expect(markup).toContain("Open result");
    expect(markup).toContain("Application screening");
    expect(markup).toContain("Applicant Intake Questionnaire");
    // responses are collapsed by default; the disclosure button is rendered but answers are hidden
    expect(markup).toContain("View 1 response");
  });
});
