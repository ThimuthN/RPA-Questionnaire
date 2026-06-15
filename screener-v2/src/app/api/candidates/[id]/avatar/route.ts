import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { prisma } from "@/lib/db/prisma";

const AVATAR_MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const permission = await requireCandidatePermission(auth.session, id, "manage_candidates");
  if (!permission.ok) return permission.response;

  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > AVATAR_MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 4 MB limit." }, { status: 413 });
  }

  const formData = await request.formData();
  const file = formData.get("avatar");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, or GIF images are allowed." }, { status: 415 });
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 4 MB limit." }, { status: 413 });
  }

  // Delete existing avatar blob if present
  const existing = await prisma.candidate.findUnique({
    where: { id },
    select: { avatarUrl: true }
  });
  if (existing?.avatarUrl) {
    await del(existing.avatarUrl).catch(() => {});
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/gif" ? "gif" : "jpg";
  const pathname = `candidates/${id}/avatar.${ext}`;
  const blob = await put(pathname, file, { access: "public", addRandomSuffix: false, allowOverwrite: true });

  await prisma.candidate.update({
    where: { id },
    data: { avatarUrl: blob.url }
  });

  return NextResponse.json({ ok: true, avatarUrl: blob.url });
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

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    select: { avatarUrl: true }
  });

  if (candidate?.avatarUrl) {
    await del(candidate.avatarUrl).catch(() => {});
    await prisma.candidate.update({ where: { id }, data: { avatarUrl: null } });
  }

  return NextResponse.json({ ok: true });
}
