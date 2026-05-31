import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
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
  const { id } = await params;
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const permission = await requireCandidatePermission(auth.session, id, "manage_candidates");
  if (!permission.ok) {
    return permission.response;
  }

  const { session } = auth;

  try {
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
    const url = new URL(`/candidates/${id}`, request.url);
    url.searchParams.set("error", error instanceof z.ZodError ? "Invalid note." : "Could not add note.");
    return NextResponse.redirect(url, 303);
  }
}
