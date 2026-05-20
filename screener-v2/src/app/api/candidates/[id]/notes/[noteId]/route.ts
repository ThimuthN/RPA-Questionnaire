import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { deleteCandidateNote, updateCandidateNote } from "@/lib/db/candidates";

const updateNoteSchema = z.object({
  body: z.string().min(2)
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const { session } = auth;

  try {
    const { id: candidateId, noteId } = await params;
    const body = updateNoteSchema.parse(await request.json());

    await updateCandidateNote({
      noteId,
      candidateId,
      body: body.body,
      updatedById: session.userId ?? undefined,
      updatedByName: session.name || session.email || "System"
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const { session } = auth;

  try {
    const { id: candidateId, noteId } = await params;

    await deleteCandidateNote({
      noteId,
      candidateId,
      deletedById: session.userId ?? undefined,
      deletedByName: session.name || session.email || "System"
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete note" },
      { status: 500 }
    );
  }
}
