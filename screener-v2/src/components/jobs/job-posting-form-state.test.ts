import { describe, expect, it } from "vitest";
import {
  firstInvalidJobPostingStep,
  normalizeStoredJobPostingDraft,
  validateJobPostingForm,
  validateJobPostingStep,
  type JobPostingFormValues
} from "./job-posting-form-state";

const baseValues: JobPostingFormValues = {
  title: "Automation Engineer",
  roleId: "role-1",
  remotePolicy: "Hybrid",
  summary: "Build automation systems",
  description: "<p>This description is comfortably longer than twenty characters.</p>",
  techStack: "TypeScript, Playwright",
  salaryMin: "90000",
  salaryMax: "120000",
  salaryCurrency: "USD",
  screenerPresetId: "preset-1",
  isPublished: true,
  isOpen: true
};

describe("job-posting-form-state", () => {
  it("validates basics fields on the basics step", () => {
    const errors = validateJobPostingStep(
      {
        ...baseValues,
        title: "A",
        roleId: ""
      },
      0
    );

    expect(errors.title).toBe("Job title must be at least 2 characters.");
    expect(errors.roleId).toBe("Select a role before continuing.");
    expect(errors.summary).toBeUndefined();
  });

  it("validates rich text description content, not raw html length", () => {
    const errors = validateJobPostingForm({
      ...baseValues,
      description: "<p>short</p>"
    });

    expect(errors.description).toBe("Description must be at least 20 characters.");
  });

  it("flags inverted salary ranges on the compensation step", () => {
    const errors = validateJobPostingStep(
      {
        ...baseValues,
        salaryMin: "150000",
        salaryMax: "120000"
      },
      2
    );

    expect(errors.salaryMin).toBe("Minimum salary cannot be greater than maximum salary.");
    expect(errors.salaryMax).toBe("Minimum salary cannot be greater than maximum salary.");
  });

  it("finds the first invalid step from aggregated errors", () => {
    const step = firstInvalidJobPostingStep({
      description: "Description must be at least 20 characters."
    });

    expect(step).toBe(1);
  });

  it("normalizes stored draft values defensively", () => {
    const draft = normalizeStoredJobPostingDraft(
      {
        step: 3,
        values: {
          title: "Recovered title",
          isPublished: false,
          isOpen: "not-a-boolean",
          summary: 12
        }
      },
      baseValues
    );

    expect(draft).toEqual({
      step: 3,
      values: expect.objectContaining({
        title: "Recovered title",
        isPublished: false,
        isOpen: true,
        summary: baseValues.summary
      })
    });
  });
});
