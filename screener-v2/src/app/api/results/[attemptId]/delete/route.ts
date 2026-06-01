import { NextResponse } from "next/server";
import { requireApiSession, requirePermission } from "@/lib/auth/guards";
import { deleteResultAttempt } from "@/lib/db/repositories";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const perm = requirePermission(auth.session, "view_results");
  if (!perm.ok) {
    return perm.response;
  }

  try {
    const { attemptId } = await context.params;
    await deleteResultAttempt(attemptId);

    const url = new URL("/results", request.url);
    url.searchParams.set("deleted", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL("/results", request.url);
    url.searchParams.set("error", "Could not delete result.");
    return NextResponse.redirect(url, 303);
  }
}
