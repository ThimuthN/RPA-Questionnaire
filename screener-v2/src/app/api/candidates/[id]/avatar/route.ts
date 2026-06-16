import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { logError } from "@/lib/server/logger";
import { prisma } from "@/lib/db/prisma";

// Candidate photos are PII. We keep them small, validated, and behind an
// unguessable URL, and we always remove the previous blob so storage never
// leaks. The client normalizes/strips EXIF before upload (see
// CandidateAvatarUpload); the server re-validates type + size as defense in depth.
// NOTE: served via a public-but-unguessable Blob URL (vs. the private+proxied
// résumé pattern) so it works directly in next/image. Tighten to a private
// proxied route if a stricter PII posture is required.
const AVATAR_MAX_BYTES = 4 * 1024 * 1024; // 4 MB (post-normalization this is tiny)
const AVATAR_ALLOWED_TYPES = ["image/webp", "image/jpeg", "image/png"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const permission = await requireCandidatePermission(auth.session, id, "manage_candidates");
  if (!permission.ok) return permission.response;

  try {
    const formData = await request.formData();
    const file = formData.get("avatar");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "No image was provided." }, { status: 400 });
    }

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Please use a JPEG, PNG, or WebP image." },
        { status: 415 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "The image file is empty." }, { status: 400 });
    }
    if (file.size > AVATAR_MAX_BYTES) {
      return NextResponse.json({ error: "Image exceeds the 4 MB limit." }, { status: 413 });
    }

    // Remove the previous avatar blob first so storage never accumulates orphans.
    const existing = await prisma.candidate.findUnique({
      where: { id },
      select: { avatarUrl: true }
    });

    const ext = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
    // addRandomSuffix → unguessable URL + automatic cache-busting on re-upload.
    const blob = await put(`candidates/${id}/avatar.${ext}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type
    });

    await prisma.candidate.update({
      where: { id },
      data: { avatarUrl: blob.url }
    });

    if (existing?.avatarUrl && existing.avatarUrl !== blob.url) {
      await del(existing.avatarUrl).catch(() => {
        /* best-effort cleanup; never fail the request on stale-blob deletion */
      });
    }

    return NextResponse.json({ ok: true, avatarUrl: blob.url });
  } catch (error) {
    logError("candidate_avatar_upload_failed", {
      candidateId: id,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: "Could not upload the photo. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const permission = await requireCandidatePermission(auth.session, id, "manage_candidates");
  if (!permission.ok) return permission.response;

  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: { avatarUrl: true }
    });

    if (candidate?.avatarUrl) {
      await del(candidate.avatarUrl).catch(() => {});
      await prisma.candidate.update({ where: { id }, data: { avatarUrl: null } });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logError("candidate_avatar_delete_failed", {
      candidateId: id,
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ error: "Could not remove the photo." }, { status: 500 });
  }
}
