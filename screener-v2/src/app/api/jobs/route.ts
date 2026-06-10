import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { createJobPosting, validateJobPostingWorkspaceSelection } from "@/lib/db/jobs";
import { jobDescriptionTextContent, sanitizeJobDescriptionHtml } from "@/lib/jobs/rich-text";
import { JobValidationError, parseSalaryField, parseTeamSizeField, validateSalaryRange } from "@/lib/jobs/validation";

const ALLOWED_RETURN_PATHS = ["/people/candidates/jobs", "/departments/"];

function sanitizeReturnTo(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (ALLOWED_RETURN_PATHS.some((prefix) => trimmed.startsWith(prefix))) return trimmed;
  return undefined;
}

/**
 * Converts any thrown value into a safe, user-facing error message.
 * Zod errors → first human-readable issue message.
 * Prisma errors → generic safe message (no internal details exposed).
 * Application errors (our own code) → pass through as-is.
 */
function formatJobError(error: unknown): string {
  if (error instanceof z.ZodError) {
    const first = error.issues[0];
    if (!first) return "Please check the form and try again.";
    return first.message;
  }
  if (error instanceof Error) {
    if (error.constructor.name.startsWith("Prisma")) {
      return "Could not save the job. Please try again.";
    }
    if (error instanceof JobValidationError) {
      return error.message;
    }
    return "Could not create job.";
  }
  return "Could not create job.";
}

const jobSchema = z.object({
  title: z.string().min(2, "Job title must be at least 2 characters."),
  roleId: z.string().min(1, "A role is required."),
  departmentId: z.string().optional(),
  screenerPresetId: z.string().optional(),
  summary: z.string().min(8, "Summary must be at least 8 characters."),
  description: z.string().min(20, "Description must be at least 20 characters."),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  teamSize: z.string().optional(),
  techStack: z.string().optional(),
  remotePolicy: z.string().optional(),
  isPublished: z.string().optional(),
  isOpen: z.string().optional(),
  returnTo: z.string().optional()
});

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const wantsJson = request.headers.get("accept")?.includes("application/json");
  const rawForm = Object.fromEntries((await request.formData()).entries());
  const returnTo = sanitizeReturnTo(rawForm.returnTo);

  try {
    const body = jobSchema.parse(rawForm);
    const selection = await validateJobPostingWorkspaceSelection({
      roleId: body.roleId,
      departmentId: body.departmentId,
      screenerPresetId: body.screenerPresetId
    });
    const permission = await requirePermissionForDepartment(
      auth.session,
      "create_job",
      selection.roleDepartmentId
    );
    if (!permission.ok) {
      return permission.response;
    }

    const description = sanitizeJobDescriptionHtml(body.description);
    if (jobDescriptionTextContent(description).length < 20) {
      throw new JobValidationError("Description should be at least 20 characters.");
    }

    const salaryMin = parseSalaryField(body.salaryMin);
    const salaryMax = parseSalaryField(body.salaryMax);
    validateSalaryRange(salaryMin, salaryMax);

    await createJobPosting({
      title: body.title,
      roleId: body.roleId,
      screenerPresetId: body.screenerPresetId,
      summary: body.summary,
      description,
      salaryMin,
      salaryMax,
      teamSize: parseTeamSizeField(body.teamSize),
      techStack: body.techStack?.trim(),
      remotePolicy: body.remotePolicy?.trim(),
      isPublished: body.isPublished === "on",
      isOpen: body.isOpen === "on"
    });

    const successPath = returnTo ?? "/people/candidates/jobs";
    const url = new URL(successPath, request.url);
    url.searchParams.set("created", "1");
    if (wantsJson) {
      return NextResponse.json({ ok: true, next: `${url.pathname}${url.search}` });
    }
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const errorMessage = formatJobError(error);
    const errorBase = returnTo
      ? `/departments/${returnTo.split("/departments/")[1]?.split("/")[0]}/jobs/new`
      : "/people/candidates/jobs/new";
    const url = new URL(errorBase, request.url);
    url.searchParams.set("error", errorMessage);
    if (returnTo) url.searchParams.set("returnTo", returnTo);
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, message: errorMessage, next: `${url.pathname}${url.search}` },
        { status: 400 }
      );
    }
    return NextResponse.redirect(url, 303);
  }
}
