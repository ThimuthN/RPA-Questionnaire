import { NextResponse } from "next/server";
import { getAppSession as getSession } from "@/lib/auth/app-session";
import { deleteResultAttempt } from "@/lib/db/repositories";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
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
