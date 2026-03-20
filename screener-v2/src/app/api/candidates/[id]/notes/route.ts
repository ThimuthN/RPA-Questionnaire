import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { candidateNoteTypeValues } from "@/lib/candidates/types";
import { addCandidateNote } from "@/lib/db/candidates";

const noteSchema = z.object({
  type: z.enum(candidateNoteTypeValues),
  body: z.string().min(2)
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = noteSchema.parse(Object.fromEntries((await request.formData()).entries()));
    await addCandidateNote({
      candidateId: id,
      type: body.type,
      body: body.body,
      createdById: session.userId ?? undefined
    });

    const url = new URL(`/candidates/${id}`, request.url);
    url.searchParams.set("noteAdded", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const { id } = await params;
    const url = new URL(`/candidates/${id}`, request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not add note.");
    return NextResponse.redirect(url, 303);
  }
}
