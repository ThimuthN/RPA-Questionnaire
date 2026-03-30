import { NextResponse } from "next/server";
import { getAppSession as getSession } from "@/lib/auth/app-session";
import { deleteCandidate } from "@/lib/db/candidates";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteCandidate(id);

    const url = new URL("/candidates", request.url);
    url.searchParams.set("deleted", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL("/candidates", request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not delete candidate.");
    return NextResponse.redirect(url, 303);
  }
}
