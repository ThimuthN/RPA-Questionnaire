import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { updateCandidateApplicationLifecycle } from "@/lib/db/jobs";

const actionSchema = z.object({
  action: z.enum(["review", "promote", "close"]),
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

  try {
    const body = actionSchema.parse(Object.fromEntries((await request.formData()).entries()));
    const application = await updateCandidateApplicationLifecycle({
      applicationId: id,
      action: body.action
    });

    const redirectTo = body.returnTo?.trim() || `/candidates/${application.candidateId}`;
    const url = new URL(redirectTo.startsWith("/") ? redirectTo : `/candidates/${application.candidateId}`, request.url);
    url.searchParams.set("updated", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL("/people/candidates/applicants", request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not update application.");
    return NextResponse.redirect(url, 303);
  }
}
