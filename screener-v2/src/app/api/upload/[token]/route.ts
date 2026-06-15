import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { prisma } from "@/lib/db/prisma";
import { resolveUploadToken, markUploadTokenUsed } from "@/lib/external-assessment-upload-token";
import { candidateExternalAssessmentStoragePrefix, persistCandidateExternalAssessmentAttachment } from "@/lib/candidates/external-assessment-storage";
import {
  normalizeExternalAssessmentFileName,
  candidateExternalAssessmentAttachmentMaxSizeBytes,
  candidateExternalAssessmentAttachmentMaxFiles
} from "@/lib/candidates/external-assessment-config";
import { checkAuthRateLimit } from "@/lib/server/rate-limit";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
  "application/x-zip-compressed"
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await resolveUploadToken(token);

  if (result.status !== "valid") {
    return NextResponse.json({ status: result.status }, { status: result.status === "not_found" ? 404 : 410 });
  }

  const { assessment } = result.record;
  return NextResponse.json({ status: "valid", title: assessment.title });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await resolveUploadToken(token);

  if (result.status !== "valid") {
    const msg = result.status === "used"
      ? "This upload link has already been used."
      : result.status === "expired"
        ? "This upload link has expired."
        : "Upload link not found.";
    return NextResponse.json({ error: msg }, { status: 410 });
  }

  const { assessment } = result.record;

  // This is the only unauthenticated external upload surface — throttle per IP and per token.
  const rate = await checkAuthRateLimit({
    request,
    identifier: token,
    scope: "public-upload",
    ipMax: 30,
    idMax: 10
  });
  if (!rate.ok) {
    return NextResponse.json({ error: rate.message }, { status: 429 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Must use multipart/form-data" }, { status: 400 });
  }

  // Reject oversized payloads before buffering the multipart body.
  const maxTotalBytes = candidateExternalAssessmentAttachmentMaxSizeBytes * candidateExternalAssessmentAttachmentMaxFiles;
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxTotalBytes + 1_000_000) {
    return NextResponse.json({ error: "Upload too large." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Could not parse form data." }, { status: 400 });
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }
  if (files.length > candidateExternalAssessmentAttachmentMaxFiles) {
    return NextResponse.json({ error: `Maximum ${candidateExternalAssessmentAttachmentMaxFiles} files allowed.` }, { status: 400 });
  }

  for (const file of files) {
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: `File type not allowed: ${file.name}` }, { status: 400 });
    }
    if (file.size > candidateExternalAssessmentAttachmentMaxSizeBytes) {
      return NextResponse.json({ error: `File too large: ${file.name}` }, { status: 400 });
    }
  }

  const existing = await prisma.candidateExternalAssessment.findUnique({
    where: { id: assessment.id },
    include: { _count: { select: { attachments: true } } }
  });
  if (!existing) {
    return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  }

  const uploaded: string[] = [];
  try {
    for (const file of files) {
      const safeName = normalizeExternalAssessmentFileName(file.name);
      const storageKey = `${candidateExternalAssessmentStoragePrefix(assessment.candidateId, assessment.id)}upload-${Date.now()}-${safeName}`;

      const blob = await put(storageKey, file, {
        access: "private",
        addRandomSuffix: false,
        contentType: file.type
      });

      await persistCandidateExternalAssessmentAttachment({
        candidateId: assessment.candidateId,
        externalAssessmentId: assessment.id,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storageKey: blob.pathname,
        storageUrl: blob.url
      });

      uploaded.push(file.name);
    }

    await markUploadTokenUsed(token);
    return NextResponse.json({ ok: true, uploaded }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed." }, { status: 500 });
  }
}
