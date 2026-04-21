import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { getJobPosting, updateJobPosting } from "@/lib/db/jobs";

const updateJobSchema = z.object({
  title: z.string().min(2).optional(),
  roleId: z.string().optional(),
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

  const { id } = await params;

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
        summary: current.summary,
        description: current.description,
        isPublished: !current.isPublished,
        isOpen: current.isOpen
      });
      const url = new URL("/people/candidates/jobs", request.url);
      url.searchParams.set("updated", "1");
      return NextResponse.redirect(url, 303);
    }

    if (body.action === "toggle_open") {
      await updateJobPosting(id, {
        title: current.title,
        roleId: current.roleId,
        summary: current.summary,
        description: current.description,
        isPublished: current.isPublished,
        isOpen: !current.isOpen
      });
      const url = new URL("/people/candidates/jobs", request.url);
      url.searchParams.set("updated", "1");
      return NextResponse.redirect(url, 303);
    }

    if (!body.title || !body.summary || !body.description) {
      throw new Error("Job details are required.");
    }

    await updateJobPosting(id, {
      title: body.title,
      roleId: body.roleId,
      summary: body.summary,
      description: body.description,
      isPublished: body.isPublished === "on",
      isOpen: body.isOpen === "on"
    });

    const url = new URL(`/people/candidates/jobs/${id}`, request.url);
    url.searchParams.set("updated", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL(`/people/candidates/jobs/${id}`, request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not update job.");
    return NextResponse.redirect(url, 303);
  }
}
