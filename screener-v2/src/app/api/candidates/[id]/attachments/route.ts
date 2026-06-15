import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { prisma } from "@/lib/db/prisma";
import { createRequestLogContext, logRouteError, messageFromError } from "@/lib/server/logger";

const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const ATTACHMENT_ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const permission = await requireCandidatePermission(auth.session, id, "view_candidates");
  if (!permission.ok) return permission.response;

  const attachments = await prisma.candidateAttachment.findMany({
    where: { candidateId: id },
    orderBy: { uploadedAt: "desc" },
    take: 50,
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      storageUrl: true,
      label: true,
      uploadedAt: true,
    },
  });

  return NextResponse.json({ ok: true, attachments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const logContext = createRequestLogContext(request, "api.candidates.attachments.upload", {
    candidateId: id,
  });
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const permission = await requireCandidatePermission(auth.session, id, "manage_candidates");
  if (!permission.ok) return permission.response;

  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new Error("Must use multipart form data.");
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > ATTACHMENT_MAX_BYTES) {
      throw new Error("File exceeds 20 MB limit.");
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!candidate) throw new Error("Candidate not found.");

    const formData = await request.formData();
    const file = formData.get("file");
    const label = typeof formData.get("label") === "string" ? String(formData.get("label")).trim() : undefined;

    if (!(file instanceof File)) throw new Error("Choose a file.");
    if (file.size > ATTACHMENT_MAX_BYTES) throw new Error("File exceeds 20 MB limit.");
    if (!ATTACHMENT_ALLOWED_TYPES.includes(file.type)) {
      throw new Error("File type not allowed. Accepted: PDF, Word, Excel, images, plain text.");
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `candidate-attachments/${id}/${stamp}-${safeName}`;

    const blob = await put(storageKey, file, {
      access: "private",
      addRandomSuffix: false,
      contentType: file.type,
    });

    let attachment;
    try {
      attachment = await prisma.candidateAttachment.create({
        data: {
          candidateId: id,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          storageKey: blob.pathname,
          storageUrl: blob.url,
          label: label || null,
        },
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          storageUrl: true,
          label: true,
          uploadedAt: true,
        },
      });
    } catch (dbError) {
      await del(blob.pathname);
      throw dbError;
    }

    return NextResponse.json({ ok: true, attachment });
  } catch (error) {
    logRouteError("candidate_attachment_upload_failed", logContext, error);
    return NextResponse.json(
      { ok: false, message: messageFromError(error, "Could not upload attachment."), requestId: logContext.requestId },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const logContext = createRequestLogContext(request, "api.candidates.attachments.delete", {
    candidateId: id,
  });
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const permission = await requireCandidatePermission(auth.session, id, "manage_candidates");
  if (!permission.ok) return permission.response;

  try {
    const { attachmentId } = (await request.json()) as { attachmentId?: string };
    if (!attachmentId) throw new Error("attachmentId required.");

    const attachment = await prisma.candidateAttachment.findFirst({
      where: { id: attachmentId, candidateId: id },
      select: { id: true, storageKey: true },
    });
    if (!attachment) throw new Error("Attachment not found.");

    await prisma.candidateAttachment.delete({ where: { id: attachment.id } });
    await del(attachment.storageKey).catch(() => undefined);

    return NextResponse.json({ ok: true });
  } catch (error) {
    logRouteError("candidate_attachment_delete_failed", logContext, error);
    return NextResponse.json(
      { ok: false, message: messageFromError(error, "Could not delete attachment."), requestId: logContext.requestId },
      { status: 400 }
    );
  }
}
