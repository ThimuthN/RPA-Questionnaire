import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import {
  assertCandidateResumeCandidateExists,
  resolveCandidateResumeRecord
} from "@/lib/candidates/resume-storage";

function contentDisposition(fileName: string, download: boolean) {
  const safeName = fileName.replace(/["\r\n]/g, "_");
  return `${download ? "attachment" : "inline"}; filename="${safeName}"`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  try {
    await assertCandidateResumeCandidateExists(id);
  } catch {
    return NextResponse.json({ ok: false, message: "Candidate not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const requestedStorageKey = url.searchParams.get("storageKey")?.trim() || "";
  const download = url.searchParams.get("download") === "1";

  const resume = await resolveCandidateResumeRecord({
    candidateId: id,
    storageKey: requestedStorageKey || undefined
  });
  if (!resume) {
    return NextResponse.json({ ok: false, message: "Resume not found." }, { status: 404 });
  }

  const blob = await get(resume.storageKey, {
    access: "private",
    useCache: false
  });

  if (!blob || blob.statusCode !== 200) {
    return NextResponse.json({ ok: false, message: "Resume file not found in storage." }, { status: 404 });
  }

  return new Response(blob.stream, {
    headers: {
      "content-type": blob.blob.contentType || resume.mimeType || "application/pdf",
      "content-length": String(blob.blob.size),
      "content-disposition": contentDisposition(resume.fileName, download),
      "cache-control": "private, no-store"
    }
  });
}
