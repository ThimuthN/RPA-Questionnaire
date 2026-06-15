import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { prisma } from "@/lib/db/prisma";

function contentDisposition(fileName: string, download: boolean) {
  const safeName = fileName.replace(/["\r\n]/g, "_");
  return `${download ? "attachment" : "inline"}; filename="${safeName}"`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const { id, attachmentId } = await params;
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const permission = await requireCandidatePermission(auth.session, id, "view_candidates");
  if (!permission.ok) {
    return permission.response;
  }

  const attachment = await prisma.candidateAttachment.findFirst({
    where: { id: attachmentId, candidateId: id },
    select: { fileName: true, mimeType: true, storageKey: true }
  });

  if (!attachment) {
    return NextResponse.json({ ok: false, message: "Attachment not found." }, { status: 404 });
  }

  const download = new URL(request.url).searchParams.get("download") === "1";

  const blob = await get(attachment.storageKey, {
    access: "private",
    useCache: false
  });

  if (!blob || blob.statusCode !== 200) {
    return NextResponse.json({ ok: false, message: "File not found in storage." }, { status: 404 });
  }

  return new Response(blob.stream, {
    headers: {
      "content-type": blob.blob.contentType || attachment.mimeType || "application/octet-stream",
      "content-length": String(blob.blob.size),
      "content-disposition": contentDisposition(attachment.fileName, download),
      "cache-control": "private, no-store"
    }
  });
}
