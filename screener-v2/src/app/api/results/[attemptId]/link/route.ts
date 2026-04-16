import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { linkResultToCandidateMilestone } from "@/lib/db/repositories";

const linkResultSchema = z.object({
  milestoneId: z.string().min(1),
  returnTo: z.string().optional()
});

function buildReturnUrl(request: Request, fallbackPath: string, searchKey: string, value: string) {
  const url = new URL(fallbackPath, request.url);
  url.searchParams.set(searchKey, value);
  return url;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { session } = auth;
  const { attemptId } = await params;
  const fallbackPath = `/results/${attemptId}`;

  try {
    const raw = Object.fromEntries((await request.formData()).entries());
    const body = linkResultSchema.parse(raw);
    const returnTo =
      typeof body.returnTo === "string" && body.returnTo.startsWith("/")
        ? body.returnTo
        : fallbackPath;
    const successUrl = buildReturnUrl(request, returnTo, "linked", "1");

    await linkResultToCandidateMilestone({
      attemptId,
      milestoneId: body.milestoneId,
      createdById: session.userId ?? undefined
    });

    return NextResponse.redirect(successUrl, 303);
  } catch (error) {
    const failureUrl = buildReturnUrl(
      request,
      fallbackPath,
      "error",
      error instanceof Error ? error.message : "Could not link this result."
    );
    return NextResponse.redirect(failureUrl, 303);
  }
}
