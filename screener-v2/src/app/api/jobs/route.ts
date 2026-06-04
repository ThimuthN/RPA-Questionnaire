import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { createJobPosting } from "@/lib/db/jobs";
import { jobDescriptionTextContent, sanitizeJobDescriptionHtml } from "@/lib/jobs/rich-text";

const ALLOWED_RETURN_PATHS = ["/people/candidates/jobs", "/departments/"];

function sanitizeReturnTo(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (ALLOWED_RETURN_PATHS.some((prefix) => trimmed.startsWith(prefix))) return trimmed;
  return undefined;
}

const jobSchema = z.object({
  title: z.string().min(2),
  roleId: z.string().min(1, "A role is required."),
  screenerPresetId: z.string().optional(),
  summary: z.string().min(8),
  description: z.string().min(20),
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
  const permission = await requirePermissionForDepartment(auth.session, "create_job");
  if (!permission.ok) {
    return permission.response;
  }
  const wantsJson = request.headers.get("accept")?.includes("application/json");
  const rawForm = Object.fromEntries((await request.formData()).entries());
  const returnTo = sanitizeReturnTo(rawForm.returnTo);

  try {
    const body = jobSchema.parse(rawForm);
    const description = sanitizeJobDescriptionHtml(body.description);
    if (jobDescriptionTextContent(description).length < 20) {
      throw new Error("Description should be at least 20 characters.");
    }
    await createJobPosting({
      title: body.title,
      roleId: body.roleId,
      screenerPresetId: body.screenerPresetId,
      summary: body.summary,
      description,
      salaryMin: body.salaryMin ? Number(body.salaryMin) : undefined,
      salaryMax: body.salaryMax ? Number(body.salaryMax) : undefined,
      teamSize: body.teamSize ? Number(body.teamSize) : undefined,
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
    const errorBase = returnTo
      ? `/departments/${returnTo.split("/departments/")[1]?.split("/")[0]}/jobs/new`
      : "/people/candidates/jobs/new";
    const url = new URL(errorBase, request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not create job.");
    if (returnTo) url.searchParams.set("returnTo", returnTo);
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Could not create job.", next: `${url.pathname}${url.search}` },
        { status: 400 }
      );
    }
    return NextResponse.redirect(url, 303);
  }
}
