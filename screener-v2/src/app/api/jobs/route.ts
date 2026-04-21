import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { createJobPosting } from "@/lib/db/jobs";

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

  try {
    const body = jobSchema.parse(Object.fromEntries((await request.formData()).entries()));
    const job = await createJobPosting({
      title: body.title,
      roleId: body.roleId,
      summary: body.summary,
      description: body.description,
      isPublished: body.isPublished === "on",
      isOpen: body.isOpen === "on"
    });

    const url = new URL(`/people/candidates/jobs/${job.id}`, request.url);
    url.searchParams.set("created", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL("/people/candidates/jobs/new", request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not create job.");
    return NextResponse.redirect(url, 303);
  }
}
