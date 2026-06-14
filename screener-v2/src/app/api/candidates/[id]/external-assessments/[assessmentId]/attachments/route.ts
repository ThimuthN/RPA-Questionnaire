import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { prisma } from "@/lib/db/prisma";
import {
  assertCandidateExternalAssessmentFileCount,
  assertCandidateExternalAssessmentMimeType,
  assertCandidateExternalAssessmentSize,
  assertCandidateExternalAssessmentStorageKey,
  candidateExternalAssessmentStoragePrefix,
  persistCandidateExternalAssessmentAttachment
} from "@/lib/candidates/external-assessment-storage";
import { normalizeExternalAssessmentFileName } from "@/lib/candidates/external-assessment-config";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; assessmentId: string }> }
) {
  const { id, assessmentId } = await params;
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const permission = await requireCandidatePermission(auth.session, id, "manage_candidates");
  if (!permission.ok) return permission.response;

  // Verify the assessment belongs to this candidate
  const existing = await prisma.candidateExternalAssessment.findFirst({
    where: { id: assessmentId, candidateId: id },
    include: { _count: { select: { attachments: true } } }
  });

  if (!existing) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  assertCandidateExternalAssessmentFileCount(existing._count.attachments + 1);

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Must use multipart/form-data" }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    assertCandidateExternalAssessmentMimeType(file.type);
    assertCandidateExternalAssessmentSize(file.size);

    const safeName = normalizeExternalAssessmentFileName(file.name);
    const storageKey = `${candidateExternalAssessmentStoragePrefix(id, assessmentId)}${Date.now()}-${safeName}`;
    assertCandidateExternalAssessmentStorageKey(id, assessmentId, storageKey);

    const blob = await put(storageKey, file, {
      access: "private",
      addRandomSuffix: false,
      contentType: file.type
    });

    let attachment;
    try {
      attachment = await persistCandidateExternalAssessmentAttachment({
        candidateId: id,
        externalAssessmentId: assessmentId,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storageKey: blob.pathname,
        storageUrl: blob.url,
        uploadedById: auth.session.userId ?? undefined
      });
    } catch (err) {
      await del(blob.pathname);
      throw err;
    }

    return NextResponse.json({ id: attachment.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
