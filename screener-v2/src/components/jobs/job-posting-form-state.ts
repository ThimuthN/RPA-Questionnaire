import { jobDescriptionTextContent } from "@/lib/jobs/rich-text";
import { parseSalaryField, validateSalaryRange } from "@/lib/jobs/validation";

export const JOB_POSTING_STEPS = [
  {
    key: "basics",
    label: "Basics",
    title: "Core job details",
    description: "Set the internal title, designation, and work mode."
  },
  {
    key: "listing",
    label: "Public listing",
    title: "Public listing",
    description: "Write the short summary and full description applicants will read."
  },
  {
    key: "compensation",
    label: "Compensation",
    title: "Compensation",
    description: "Add an optional salary range that is accurate and internally consistent."
  },
  {
    key: "screening",
    label: "Application screening",
    title: "Application screening",
    description: "Attach a screening package when applicants should complete add-ons during application."
  },
  {
    key: "publish",
    label: "Publish",
    title: "Availability",
    description: "Control whether the role is visible publicly and whether applications are open."
  },
  {
    key: "review",
    label: "Review",
    title: "Final review",
    description: "Confirm the posting before saving it."
  }
] as const;

export type JobPostingFormValues = {
  title: string;
  roleId: string;
  remotePolicy: string;
  summary: string;
  description: string;
  techStack: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  screenerPresetId: string;
  isPublished: boolean;
  isOpen: boolean;
};

export type JobPostingFormErrorField =
  | keyof JobPostingFormValues
  | "form";

export type JobPostingFormErrors = Partial<Record<JobPostingFormErrorField, string>>;

export type StoredJobPostingDraft = {
  step?: number;
  values?: Partial<JobPostingFormValues>;
};

type NormalizeStoredJobPostingDraftOptions = {
  maxStep?: number;
};

export function validateJobPostingStep(
  values: JobPostingFormValues,
  stepIndex: number
): JobPostingFormErrors {
  const errors = validateJobPostingForm(values);
  const stepKey = JOB_POSTING_STEPS[stepIndex]?.key;

  if (stepKey === "basics") {
    return pickErrors(errors, ["title", "roleId"]);
  }

  if (stepKey === "listing") {
    return pickErrors(errors, ["summary", "description"]);
  }

  if (stepKey === "compensation") {
    return pickErrors(errors, ["salaryMin", "salaryMax"]);
  }

  return {};
}

export function validateJobPostingForm(values: JobPostingFormValues): JobPostingFormErrors {
  const errors: JobPostingFormErrors = {};

  if (values.title.trim().length < 2) {
    errors.title = "Job title must be at least 2 characters.";
  }

  if (!values.roleId.trim()) {
    errors.roleId = "Select a role before continuing.";
  }

  if (values.summary.trim().length < 8) {
    errors.summary = "Summary must be at least 8 characters.";
  }

  if (jobDescriptionTextContent(values.description).length < 20) {
    errors.description = "Description must be at least 20 characters.";
  }

  let salaryMin: number | undefined;
  let salaryMax: number | undefined;

  try {
    salaryMin = parseSalaryField(values.salaryMin);
  } catch (error) {
    errors.salaryMin = error instanceof Error ? error.message : "Salary is invalid.";
  }

  try {
    salaryMax = parseSalaryField(values.salaryMax);
  } catch (error) {
    errors.salaryMax = error instanceof Error ? error.message : "Salary is invalid.";
  }

  if (!errors.salaryMin && !errors.salaryMax) {
    try {
      validateSalaryRange(salaryMin, salaryMax);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Minimum salary cannot be greater than maximum salary.";
      errors.salaryMin = message;
      errors.salaryMax = message;
    }
  }

  return errors;
}

export function firstInvalidJobPostingStep(errors: JobPostingFormErrors) {
  if (errors.title || errors.roleId) return 0;
  if (errors.summary || errors.description) return 1;
  if (errors.salaryMin || errors.salaryMax) return 2;
  return JOB_POSTING_STEPS.length - 1;
}

export function normalizeStoredJobPostingDraft(
  raw: unknown,
  fallbackValues: JobPostingFormValues,
  options?: NormalizeStoredJobPostingDraftOptions
): StoredJobPostingDraft | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Record<string, unknown>;
  const step =
    typeof candidate.step === "number" && Number.isInteger(candidate.step)
      ? clampStep(candidate.step, options?.maxStep)
      : undefined;
  const rawValues =
    candidate.values && typeof candidate.values === "object"
      ? (candidate.values as Record<string, unknown>)
      : null;

  if (!rawValues && step === undefined) {
    return null;
  }

  return {
    step,
    values: rawValues
      ? {
          title: readString(rawValues.title, fallbackValues.title),
          roleId: readString(rawValues.roleId, fallbackValues.roleId),
          remotePolicy: readString(rawValues.remotePolicy, fallbackValues.remotePolicy),
          summary: readString(rawValues.summary, fallbackValues.summary),
          description: readString(rawValues.description, fallbackValues.description),
          techStack: readString(rawValues.techStack, fallbackValues.techStack),
          salaryMin: readString(rawValues.salaryMin, fallbackValues.salaryMin),
          salaryMax: readString(rawValues.salaryMax, fallbackValues.salaryMax),
          salaryCurrency: readString(rawValues.salaryCurrency, fallbackValues.salaryCurrency),
          screenerPresetId: readString(rawValues.screenerPresetId, fallbackValues.screenerPresetId),
          isPublished: readBoolean(rawValues.isPublished, fallbackValues.isPublished),
          isOpen: readBoolean(rawValues.isOpen, fallbackValues.isOpen)
        }
      : undefined
  };
}

function pickErrors(
  errors: JobPostingFormErrors,
  fields: JobPostingFormErrorField[]
): JobPostingFormErrors {
  const scoped: JobPostingFormErrors = {};

  for (const field of fields) {
    if (errors[field]) {
      scoped[field] = errors[field];
    }
  }

  return scoped;
}

function clampStep(step: number, maxStep = JOB_POSTING_STEPS.length - 1) {
  return Math.min(Math.max(step, 0), maxStep);
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}
