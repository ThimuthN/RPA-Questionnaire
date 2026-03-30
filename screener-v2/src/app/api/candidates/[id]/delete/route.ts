import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { deleteCandidate } from "@/lib/db/candidates";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
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
