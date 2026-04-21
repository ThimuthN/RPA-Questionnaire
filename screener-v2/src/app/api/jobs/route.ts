import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { createJobPosting } from "@/lib/db/jobs";
import { jobDescriptionTextContent, sanitizeJobDescriptionHtml } from "@/lib/jobs/rich-text";

const jobSchema = z.object({
  title: z.string().min(2),
  roleId: z.string().optional(),
  summary: z.string().min(8),
  description: z.string().min(20),
  isPublished: z.string().optional(),
  isOpen: z.string().optional()
});

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const wantsJson = request.headers.get("accept")?.includes("application/json");

  try {
    const body = jobSchema.parse(Object.fromEntries((await request.formData()).entries()));
    const description = sanitizeJobDescriptionHtml(body.description);
    if (jobDescriptionTextContent(description).length < 20) {
      throw new Error("Description should be at least 20 characters.");
    }
    const job = await createJobPosting({
      title: body.title,
      roleId: body.roleId,
      summary: body.summary,
      description,
      isPublished: body.isPublished === "on",
      isOpen: body.isOpen === "on"
    });

    const url = new URL("/people/candidates/jobs", request.url);
    url.searchParams.set("created", "1");
    if (wantsJson) {
      return NextResponse.json({ ok: true, next: `${url.pathname}${url.search}` });
    }
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL("/people/candidates/jobs/new", request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not create job.");
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Could not create job.", next: `${url.pathname}${url.search}` },
        { status: 400 }
      );
    }
    return NextResponse.redirect(url, 303);
  }
}
