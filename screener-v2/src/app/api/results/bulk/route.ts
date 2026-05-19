import { NextResponse } from "next/server";
import { z } from "zod";
import { resultReviewStateValues } from "@/lib/assessment-engine/types";
import { requireApiSession } from "@/lib/auth/guards";
import { candidateNoteTypeValues } from "@/lib/candidates/types";
import { bulkUpdateResults } from "@/lib/db/repositories";
import {
  createRequestLogContext,
  logRouteError,
  messageFromError
} from "@/lib/server/logger";

const bulkSchema = z.object({
  action: z.enum(["set_review_state", "assign_owner", "add_note"]),
  reviewState: z.enum(resultReviewStateValues).optional(),
  owner: z.string().optional(),
  noteBody: z.string().optional(),
  noteType: z.enum(candidateNoteTypeValues).optional(),
  returnTo: z.string().optional()
});

function redirectUrl(request: Request, returnTo?: string) {
  if (returnTo?.startsWith("/")) {
    return new URL(returnTo, request.url);
  }
  return new URL("/results", request.url);
}

export async function POST(request: Request) {
  const logContext = createRequestLogContext(request, "api.results.bulk");
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const { session } = auth;

  const formData = await request.formData();
  try {
    const parsed = bulkSchema.parse(Object.fromEntries(formData.entries()));
    const result = await bulkUpdateResults({
      attemptIds: formData
        .getAll("attemptId")
        .map((value) => String(value))
        .filter(Boolean),
      action: parsed.action,
      reviewState: parsed.reviewState,
      owner: parsed.owner,
      noteBody: parsed.noteBody,
      noteType: parsed.noteType,
      createdById: session.userId ?? undefined
    });

    const url = redirectUrl(request, parsed.returnTo);
    url.searchParams.set("updated", String(result.updatedCount));
    return NextResponse.redirect(url, 303);
  } catch (error) {
    logRouteError("results_bulk_update_failed", logContext, error, {
      userId: session.userId
    });

    const url = redirectUrl(request, String(formData.get("returnTo") || ""));
    url.searchParams.set("error", messageFromError(error, "Could not update results."));
    url.searchParams.set("requestId", logContext.requestId);
    return NextResponse.redirect(url, 303);
  }
}
