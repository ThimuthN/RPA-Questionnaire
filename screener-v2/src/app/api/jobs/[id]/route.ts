import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermission } from "@/lib/auth/guards";
import { getJobPosting, updateJobPosting } from "@/lib/db/jobs";
import { jobDescriptionTextContent, sanitizeJobDescriptionHtml } from "@/lib/jobs/rich-text";

const updateJobSchema = z.object({
  title: z.string().min(2).optional(),
  roleId: z.string().min(1, "A role is required.").optional(),
  screenerPresetId: z.string().optional(),
  summary: z.string().min(8).optional(),
  description: z.string().min(20).optional(),
  isPublished: z.string().optional(),
  isOpen: z.string().optional(),
  action: z.enum(["save", "toggle_published", "toggle_open"]).optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const permission = requirePermission(auth.session, "edit_job");
  if (!permission.ok) return permission.response;

  const { id } = await params;
  const wantsJson = request.headers.get("accept")?.includes("application/json");

  try {
    const body = updateJobSchema.parse(Object.fromEntries((await request.formData()).entries()));
    const current = await getJobPosting(id);

    if (!current) {
      throw new Error("Job not found.");
    }

    if (body.action === "toggle_published") {
      await updateJobPosting(id, {
        title: current.title,
        roleId: current.roleId,
        screenerPresetId: current.screenerPresetId,
        summary: current.summary,
        description: current.description,
        isPublished: !current.isPublished,
        isOpen: current.isOpen
      });
      const url = new URL("/people/candidates/jobs", request.url);
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
        isPublished: current.isPublished,
        isOpen: !current.isOpen
      });
      const url = new URL("/people/candidates/jobs", request.url);
      url.searchParams.set("updated", "1");
      if (wantsJson) {
        return NextResponse.json({ ok: true, next: `${url.pathname}${url.search}` });
      }
      return NextResponse.redirect(url, 303);
    }

    if (!body.title || !body.summary || !body.description) {
      throw new Error("Job details are required.");
    }
    if (!body.roleId) {
      throw new Error("A role is required to save this job.");
    }
    const description = sanitizeJobDescriptionHtml(body.description);
    if (jobDescriptionTextContent(description).length < 20) {
      throw new Error("Description should be at least 20 characters.");
    }

    await updateJobPosting(id, {
      title: body.title,
      roleId: body.roleId,
      screenerPresetId: body.screenerPresetId,
      summary: body.summary,
      description,
      isPublished: body.isPublished === "on",
      isOpen: body.isOpen === "on"
    });

    const url = new URL(`/people/candidates/jobs/${id}`, request.url);
    url.searchParams.set("updated", "1");
    if (wantsJson) {
      return NextResponse.json({ ok: true, next: `${url.pathname}${url.search}` });
    }
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL(`/people/candidates/jobs/${id}`, request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not update job.");
    if (request.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Could not update job.", next: `${url.pathname}${url.search}` },
        { status: 400 }
      );
    }
    return NextResponse.redirect(url, 303);
  }
}
