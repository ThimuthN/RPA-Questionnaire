import { beforeEach, describe, expect, it, vi } from "vitest";
import { applicantIntakeQuestion } from "@/features/applicant-intake-questionnaire/questions";

const prismaMocks = vi.hoisted(() => ({
  jobPostingFindFirst: vi.fn(),
  candidateApplicationFindUnique: vi.fn(),
  txCandidateUpdate: vi.fn(),
  txDepartmentCandidacyUpsert: vi.fn(),
  txCandidateApplicationCreate: vi.fn(),
  txAddonResultDeleteMany: vi.fn(),
  txResponseDeleteMany: vi.fn(),
  txAddonResultCreate: vi.fn(),
  txResponseCreateMany: vi.fn(),
  transaction: vi.fn()
}));

const candidateMocks = vi.hoisted(() => ({
  createCandidate: vi.fn(),
  findExistingCandidateByEmail: vi.fn(),
  mapCandidate: vi.fn()
}));

vi.mock("./prisma", () => ({
  prisma: {
    jobPosting: {
      findFirst: prismaMocks.jobPostingFindFirst
    },
    candidateApplication: {
      findUnique: prismaMocks.candidateApplicationFindUnique
    },
    $transaction: prismaMocks.transaction
  }
}));

vi.mock("@/lib/db/candidates", () => ({
  createCandidate: candidateMocks.createCandidate,
  findExistingCandidateByEmail: candidateMocks.findExistingCandidateByEmail,
  mapCandidate: candidateMocks.mapCandidate
}));

vi.mock("@/lib/tokens/token-service", () => ({
  cuidLike: vi.fn(() => "mock-cuid")
}));

import {
  createCandidateApplicationFromPublicSubmission,
  getApplicantReviewDetail
} from "./jobs";

const COMPLETE_INTAKE_RESPONSE = {
  workEligibility: true,
  nightShiftComfort: false,
  salaryExpectation: { currency: "LKR", amount: 150000, period: "monthly" },
  noticePeriod: "2 weeks",
  currentLocation: "Colombo, Sri Lanka",
  workArrangementComfort: "hybrid",
  additionalNotes: ""
};

function makeJobRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    slug: "rpa-engineer",
    title: "RPA Engineer",
    roleId: null,
    role: {
      departmentId: null
    },
    screenerPresetId: null,
    screenerPreset: null,
    ...overrides
  };
}

function makeScreeningPreset() {
  return {
    id: "preset-1",
    label: "Applicant Intake Questionnaire",
    items: [
      {
        id: "item-1",
        sortOrder: 0,
        configOverrideJson: {},
        weightOverride: null,
        addon: {
          id: "addon-1",
          slug: "applicant-intake-questionnaire",
          label: "Applicant Intake Questionnaire",
          description: "Public intake questions",
          assessmentTypeId: "applicant_intake_questionnaire",
          defaultConfigJson: {},
          defaultDurationMinutes: 5,
          defaultRequiredPercent: 100,
          defaultWeight: 1
        }
      }
    ]
  };
}

function makeApplicantDetailRow() {
  return {
    id: "application-1",
    status: "submitted",
    coverNote: "Strong fit for the role.",
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T02:00:00.000Z"),
    candidate: {
      id: "cand-1",
      fullName: "Alice Applicant",
      email: "alice@example.com",
      phone: "+1 555 0100",
      hrOwner: null,
      stage: "applicant",
      departmentId: "dept-1",
      resumes: [
        {
          fileName: "alice.pdf",
          storageKey: "candidate-resumes/cand-1/alice.pdf",
          sizeBytes: 2048,
          uploadedAt: new Date("2026-06-01T01:00:00.000Z")
        }
      ],
      role: {
        label: "RPA Engineer",
        department: "Automation"
      }
    },
    jobPosting: {
      id: "job-1",
      slug: "rpa-engineer",
      title: "RPA Engineer",
      roleId: "role-1",
      screenerPresetId: "preset-1",
      summary: "Build automation solutions.",
      description: "Public job description",
      salaryMin: null,
      salaryMax: null,
      teamSize: null,
      techStack: null,
      remotePolicy: null,
      isPublished: true,
      isOpen: true,
      createdAt: new Date("2026-05-20T00:00:00.000Z"),
      updatedAt: new Date("2026-05-21T00:00:00.000Z"),
      role: {
        label: "RPA Engineer",
        department: "Automation"
      },
      screenerPreset: {
        id: "preset-1",
        label: "Applicant Intake Questionnaire"
      }
    },
    screeningAddonResults: [
      {
        addonId: "addon-1",
        addonLabel: "Applicant Intake Questionnaire",
        requiredPercent: 100,
        weight: 1,
        isMandatory: true,
        inlineSupported: true,
        status: "passed",
        applicantPercent: 100,
        pointsEarned: 1,
        pointsPossible: 1,
        responses: [
          {
            questionKey: "salaryExpectation",
            questionLabel: "What is your expected compensation?",
            formatLabel: "Questionnaire",
            answerText: "LKR 150,000 / monthly",
            pointsEarned: 0,
            pointsPossible: 0,
            sortOrder: 1
          },
          {
            questionKey: "workEligibility",
            questionLabel: "Are you legally eligible to work for this role?",
            formatLabel: "Questionnaire",
            answerText: "Yes",
            pointsEarned: 0,
            pointsPossible: 0,
            sortOrder: 0
          }
        ]
      }
    ]
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  prismaMocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
    callback({
      candidate: {
        update: prismaMocks.txCandidateUpdate
      },
      departmentCandidacy: {
        upsert: prismaMocks.txDepartmentCandidacyUpsert
      },
      candidateApplication: {
        create: prismaMocks.txCandidateApplicationCreate
      },
      candidateApplicationAddonResult: {
        deleteMany: prismaMocks.txAddonResultDeleteMany,
        create: prismaMocks.txAddonResultCreate
      },
      candidateApplicationResponse: {
        deleteMany: prismaMocks.txResponseDeleteMany,
        createMany: prismaMocks.txResponseCreateMany
      }
    })
  );

  prismaMocks.txCandidateApplicationCreate.mockResolvedValue({ id: "application-1" });
  prismaMocks.txAddonResultDeleteMany.mockResolvedValue({ count: 0 });
  prismaMocks.txResponseDeleteMany.mockResolvedValue({ count: 0 });
  prismaMocks.txAddonResultCreate.mockResolvedValue({ id: "addon-result-1" });
  prismaMocks.txResponseCreateMany.mockResolvedValue({ count: 7 });
  candidateMocks.mapCandidate.mockImplementation((candidate) => candidate);
});

describe("createCandidateApplicationFromPublicSubmission", () => {
  it("creates a normal application when no screening package is attached", async () => {
    prismaMocks.jobPostingFindFirst.mockResolvedValue(makeJobRow());
    candidateMocks.findExistingCandidateByEmail.mockResolvedValue(null);
    candidateMocks.createCandidate.mockResolvedValue({
      id: "cand-1",
      fullName: "Alice Applicant",
      email: "alice@example.com"
    });
    prismaMocks.candidateApplicationFindUnique.mockResolvedValue(null);

    const result = await createCandidateApplicationFromPublicSubmission({
      jobSlug: "rpa-engineer",
      fullName: "Alice Applicant",
      email: "alice@example.com",
      coverNote: "Interested in the role."
    });

    expect(result).toMatchObject({
      status: "created",
      candidateId: "cand-1",
      applicationId: "application-1"
    });
    expect(prismaMocks.txCandidateApplicationCreate).toHaveBeenCalledTimes(1);
    expect(prismaMocks.txAddonResultCreate).not.toHaveBeenCalled();
    expect(prismaMocks.txResponseCreateMany).not.toHaveBeenCalled();
  });

  it("saves screening addon results and field-level responses on the application", async () => {
    prismaMocks.jobPostingFindFirst.mockResolvedValue(
      makeJobRow({
        screenerPresetId: "preset-1",
        screenerPreset: makeScreeningPreset()
      })
    );
    candidateMocks.findExistingCandidateByEmail.mockResolvedValue(null);
    candidateMocks.createCandidate.mockResolvedValue({
      id: "cand-1",
      fullName: "Alice Applicant",
      email: "alice@example.com"
    });
    prismaMocks.candidateApplicationFindUnique.mockResolvedValue(null);

    const screeningAnswers = {
      "applicant-intake-questionnaire:0": {
        [applicantIntakeQuestion.id]: COMPLETE_INTAKE_RESPONSE
      }
    };

    const result = await createCandidateApplicationFromPublicSubmission({
      jobSlug: "rpa-engineer",
      fullName: "Alice Applicant",
      email: "alice@example.com",
      screeningAnswers
    });

    expect(result.status).toBe("created");
    expect(prismaMocks.txAddonResultCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: "application-1",
        presetId: "preset-1",
        presetLabel: "Applicant Intake Questionnaire",
        addonLabel: "Applicant Intake Questionnaire",
        requiredPercent: 100,
        applicantPercent: 100,
        status: "passed"
      })
    });

    const responseBatch = prismaMocks.txResponseCreateMany.mock.calls[0]?.[0]?.data as Array<Record<string, unknown>>;
    expect(responseBatch).toHaveLength(7);
    expect(responseBatch).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          applicationId: "application-1",
          addonResultId: "addon-result-1",
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

  it("seeds unanswered screening evidence when the application is submitted before the test starts", async () => {
    prismaMocks.jobPostingFindFirst.mockResolvedValue(
      makeJobRow({
        screenerPresetId: "preset-1",
        screenerPreset: makeScreeningPreset()
      })
    );
    candidateMocks.findExistingCandidateByEmail.mockResolvedValue(null);
    candidateMocks.createCandidate.mockResolvedValue({
      id: "cand-1",
      fullName: "Alice Applicant",
      email: "alice@example.com"
    });
    prismaMocks.candidateApplicationFindUnique.mockResolvedValue(null);

    const result = await createCandidateApplicationFromPublicSubmission({
      jobSlug: "rpa-engineer",
      fullName: "Alice Applicant",
      email: "alice@example.com"
    });

    expect(result).toMatchObject({
      status: "created",
      requiresScreening: true
    });
    expect(prismaMocks.txAddonResultCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: "application-1",
        status: "failed",
        applicantPercent: 0
      })
    });
    const responseBatch = prismaMocks.txResponseCreateMany.mock.calls[0]?.[0]?.data as Array<Record<string, unknown>>;
    expect(responseBatch).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          applicationId: "application-1",
          answerText: null
        })
      ])
    );
  });

  it("returns duplicate without creating new screening responses", async () => {
    prismaMocks.jobPostingFindFirst.mockResolvedValue(
      makeJobRow({
        screenerPresetId: "preset-1",
        screenerPreset: makeScreeningPreset()
      })
    );
    candidateMocks.findExistingCandidateByEmail.mockResolvedValue({
      id: "cand-1",
      fullName: "Alice Applicant",
      email: "alice@example.com"
    });
    prismaMocks.candidateApplicationFindUnique.mockResolvedValue({
      id: "application-existing"
    });

    const result = await createCandidateApplicationFromPublicSubmission({
      jobSlug: "rpa-engineer",
      fullName: "Alice Applicant",
      email: "alice@example.com",
      screeningAnswers: {
        "applicant-intake-questionnaire:0": {
          [applicantIntakeQuestion.id]: COMPLETE_INTAKE_RESPONSE
        }
      }
    });

    expect(result).toMatchObject({
      status: "duplicate",
      applicationId: "application-existing"
    });
    expect(prismaMocks.txCandidateApplicationCreate).not.toHaveBeenCalled();
    expect(prismaMocks.txAddonResultCreate).not.toHaveBeenCalled();
    expect(prismaMocks.txResponseCreateMany).not.toHaveBeenCalled();
  });
});

describe("getApplicantReviewDetail", () => {
  it("returns application-level screening results and sorted responses", async () => {
    prismaMocks.candidateApplicationFindUnique.mockResolvedValue(makeApplicantDetailRow());
    candidateMocks.mapCandidate.mockReturnValue({
      id: "cand-1",
      fullName: "Alice Applicant",
      email: "alice@example.com",
      phone: "+1 555 0100",
      hrOwner: null,
      stage: "applicant",
      departmentId: "dept-1"
    });

    const detail = await getApplicantReviewDetail("application-1");

    expect(detail?.screeningStatus).toBe("passed");
    expect(detail?.screeningAddonResults[0]).toMatchObject({
      addonLabel: "Applicant Intake Questionnaire",
      requiredPercent: 100,
      applicantPercent: 100,
      status: "passed"
    });
    expect(detail?.screeningAddonResults[0]?.responses.map((response) => response.questionKey)).toEqual([
      "workEligibility",
      "salaryExpectation"
    ]);
  });
});
