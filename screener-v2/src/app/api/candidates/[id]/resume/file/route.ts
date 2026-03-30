import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import {
  candidateExists,
  getLatestCandidateResume
} from "@/lib/db/candidates";

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
  const exists = await candidateExists(id);
  if (!exists) {
    return NextResponse.json({ ok: false, message: "Candidate not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const requestedStorageKey = url.searchParams.get("storageKey")?.trim() || "";
  const download = url.searchParams.get("download") === "1";

  const latestResume = await getLatestCandidateResume(id);
  if (!latestResume) {
    return NextResponse.json({ ok: false, message: "Resume not found." }, { status: 404 });
  }

  const storageKey = requestedStorageKey || latestResume.storageKey;
  if (!storageKey.startsWith(`candidate-resumes/${id}/`)) {
    return NextResponse.json({ ok: false, message: "Invalid resume path." }, { status: 400 });
  }

  const blob = await get(storageKey, {
    access: "private",
    useCache: false
  });

  if (!blob || blob.statusCode !== 200) {
    return NextResponse.json({ ok: false, message: "Resume file not found in storage." }, { status: 404 });
  }

  return new Response(blob.stream, {
    headers: {
      "content-type": blob.blob.contentType || latestResume.mimeType || "application/pdf",
      "content-length": String(blob.blob.size),
      "content-disposition": contentDisposition(latestResume.fileName, download),
      "cache-control": "private, no-store"
    }
  });
}
