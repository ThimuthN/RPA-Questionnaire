import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { deleteResultAttempt } from "@/lib/db/repositories";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { attemptId } = await context.params;
    await deleteResultAttempt(attemptId);

    const url = new URL("/results", request.url);
    url.searchParams.set("deleted", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL("/results", request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not delete result.");
    return NextResponse.redirect(url, 303);
  }
}
