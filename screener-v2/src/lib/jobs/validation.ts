export const INT4_MAX = 2147483647;
export const TEAM_SIZE_MAX = 500;

/**
 * Sentinel error class for validation errors originating from our own code.
 * formatJobError passes these through as-is; all other Error types are hidden.
 */
export class JobValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobValidationError";
  }
}

/**
 * Parses a salary form field string into a safe integer for DB storage.
 * Returns undefined for empty/absent values (salary is optional).
 * Throws a JobValidationError for invalid or out-of-range values.
 */
export function parseSalaryField(value: string | undefined): number | undefined {
  if (!value || value.trim() === "") return undefined;
  const num = Number(value.trim());
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    throw new JobValidationError("Salary must be a whole number.");
  }
  if (num < 0) {
    throw new JobValidationError("Salary cannot be negative.");
  }
  if (num > INT4_MAX) {
    throw new JobValidationError("Salary is too large.");
  }
  return num;
}

/**
 * Validates that salaryMin <= salaryMax when both are provided.
 * Throws a JobValidationError if the range is inverted.
 */
export function validateSalaryRange(
  min: number | undefined,
  max: number | undefined
): void {
  if (min !== undefined && max !== undefined && min > max) {
    throw new JobValidationError("Minimum salary cannot be greater than maximum salary.");
  }
}

/**
 * Parses the optional teamSize form field.
 * Returns undefined for empty/absent values.
 * Must be a whole number between 1 and 500 (inclusive) if provided.
 * Throws a JobValidationError for invalid values.
 */
export function parseTeamSizeField(value: string | undefined): number | undefined {
  if (!value || value.trim() === "") return undefined;
  const num = Number(value.trim());
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    throw new JobValidationError("Team size must be a whole number.");
  }
  if (num < 1) {
    throw new JobValidationError("Team size must be at least 1.");
  }
  if (num > TEAM_SIZE_MAX) {
    throw new JobValidationError("Team size is too large.");
  }
  return num;
}
