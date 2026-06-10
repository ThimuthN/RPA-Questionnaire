import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import {
  getJobPosting,
  updateJobPosting,
  validateJobPostingWorkspaceSelection
} from "@/lib/db/jobs";
import { jobDescriptionTextContent, sanitizeJobDescriptionHtml } from "@/lib/jobs/rich-text";
import {
  JobValidationError,
  parseSalaryField,
  parseTeamSizeField,
  validateSalaryRange
} from "@/lib/jobs/validation";

const ALLOWED_RETURN_PATHS = ["/people/candidates/jobs", "/departments/"];

function sanitizeReturnTo(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (ALLOWED_RETURN_PATHS.some((prefix) => trimmed.startsWith(prefix))) {
    return trimmed;
  }
  return undefined;
}

function formatJobError(error: unknown) {
  if (error instanceof z.ZodError) {
    const first = error.issues[0];
    if (!first) {
      return "Please check the form and try again.";
    }

    return first.message;
  }

  if (error instanceof Error) {
    if (error.constructor.name.startsWith("Prisma")) {
      return "Could not save the job. Please try again.";
    }
    if (error instanceof JobValidationError) {
      return error.message;
    }
    return "Could not update job.";
  }

  return "Could not update job.";
}

const updateJobSchema = z.object({
  title: z.string().min(2, "Job title must be at least 2 characters.").optional(),
  roleId: z.string().min(1, "A role is required.").optional(),
  departmentId: z.string().optional(),
  screenerPresetId: z.string().optional(),
  summary: z.string().min(8, "Summary must be at least 8 characters.").optional(),
  description: z.string().min(20, "Description must be at least 20 characters.").optional(),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  teamSize: z.string().optional(),
  techStack: z.string().optional(),
  remotePolicy: z.string().optional(),
  isPublished: z.string().optional(),
  isOpen: z.string().optional(),
  action: z.enum(["save", "toggle_published", "toggle_open"]).optional(),
  returnTo: z.string().optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const wantsJson = request.headers.get("accept")?.includes("application/json");
  let formEntries: Record<string, FormDataEntryValue> = {};

  try {
    formEntries = Object.fromEntries((await request.formData()).entries());
    const body = updateJobSchema.parse(formEntries);
    const returnTo = sanitizeReturnTo(body.returnTo);
    const current = await getJobPosting(id);

    if (!current) {
      throw new JobValidationError("Job not found.");
    }

    const permission = await requirePermissionForDepartment(
      auth.session,
      "edit_job",
      current.departmentId
    );
    if (!permission.ok) {
      return permission.response;
    }

    const successBasePath = returnTo ?? `/people/candidates/jobs/${id}`;

    if (body.action === "toggle_published") {
      await updateJobPosting(id, {
        title: current.title,
        roleId: current.roleId,
        screenerPresetId: current.screenerPresetId,
        summary: current.summary,
        description: current.description,
        salaryMin: current.salaryMin,
        salaryMax: current.salaryMax,
        teamSize: current.teamSize,
        techStack: current.techStack,
        remotePolicy: current.remotePolicy,
        isPublished: !current.isPublished,
        isOpen: current.isOpen
      });
      const url = new URL(successBasePath, request.url);
      url.searchParams.set("updated", "1");
      if (wantsJson) {
        return NextResponse.json({ ok: true, next: `${url.pathname}${url.search}` });
      }
      return NextResponse.redirect(url, 303);
    }

    if (body.action === "toggle_open") {
      await updateJobPosting(id, {
        title: current.title,
        roleId: current.roleId,
        screenerPresetId: current.screenerPresetId,
        summary: current.summary,
        description: current.description,
        salaryMin: current.salaryMin,
        salaryMax: current.salaryMax,
        teamSize: current.teamSize,
        techStack: current.techStack,
        remotePolicy: current.remotePolicy,
        isPublished: current.isPublished,
        isOpen: !current.isOpen
      });
      const url = new URL(successBasePath, request.url);
      url.searchParams.set("updated", "1");
      if (wantsJson) {
        return NextResponse.json({ ok: true, next: `${url.pathname}${url.search}` });
      }
      return NextResponse.redirect(url, 303);
    }

    if (!body.title || !body.summary || !body.description) {
      throw new JobValidationError("Job details are required.");
    }
    if (!body.roleId) {
      throw new JobValidationError("A role is required to save this job.");
    }
    await validateJobPostingWorkspaceSelection({
      roleId: body.roleId,
      departmentId: body.departmentId,
      screenerPresetId: body.screenerPresetId
    });
    const description = sanitizeJobDescriptionHtml(body.description);
    if (jobDescriptionTextContent(description).length < 20) {
      throw new JobValidationError("Description should be at least 20 characters.");
    }
    const salaryMin = parseSalaryField(body.salaryMin);
    const salaryMax = parseSalaryField(body.salaryMax);
    validateSalaryRange(salaryMin, salaryMax);

    await updateJobPosting(id, {
      title: body.title,
      roleId: body.roleId,
      screenerPresetId: body.screenerPresetId,
      summary: body.summary,
      description,
      salaryMin: salaryMin ?? null,
      salaryMax: salaryMax ?? null,
      teamSize: parseTeamSizeField(body.teamSize) ?? null,
      techStack: body.techStack?.trim(),
      remotePolicy: body.remotePolicy?.trim(),
      isPublished: body.isPublished === "on",
      isOpen: body.isOpen === "on"
    });

    const url = new URL(successBasePath, request.url);
    url.searchParams.set("updated", "1");
    if (wantsJson) {
      return NextResponse.json({ ok: true, next: `${url.pathname}${url.search}` });
    }
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const returnTo = sanitizeReturnTo(formEntries.returnTo);
    const url = new URL(returnTo ?? `/people/candidates/jobs/${id}`, request.url);
    const errorMessage = formatJobError(error);
    url.searchParams.set("error", errorMessage);
    if (request.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json(
        { ok: false, message: errorMessage, next: `${url.pathname}${url.search}` },
        { status: 400 }
      );
    }
    return NextResponse.redirect(url, 303);
  }
}
