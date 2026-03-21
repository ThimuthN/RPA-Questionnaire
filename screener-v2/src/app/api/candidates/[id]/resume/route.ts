import { NextResponse } from "next/server";
import {
  generateClientTokenFromReadWriteToken,
  handleUpload,
  type HandleUploadBody
} from "@vercel/blob/client";
import { getSession } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/server/app-url";
import {
  addCandidateResume,
  candidateExists,
  getLatestCandidateResume
} from "@/lib/db/candidates";
import {
  candidateResumeMaxSizeBytes,
  candidateResumeMimeTypes
} from "@/lib/candidates/resume-config";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const callbackUrl = `${getAppUrl(request)}/api/candidates/${id}/resume`;

  try {
    const body = (await request.json()) as unknown;

    if (isRecord(body) && body.action === "token") {
      const session = await getSession();
      if (!session) {
        throw new Error("Login required.");
      }

      const exists = await candidateExists(id);
      if (!exists) {
        throw new Error("Candidate not found.");
      }

      const pathname = typeof body.pathname === "string" ? body.pathname : "";
      if (!pathname.startsWith(`candidate-resumes/${id}/`)) {
        throw new Error("Invalid resume upload path.");
      }

      const clientToken = await generateClientTokenFromReadWriteToken({
        pathname,
        allowedContentTypes: [...candidateResumeMimeTypes],
        maximumSizeInBytes: candidateResumeMaxSizeBytes,
        addRandomSuffix: false
      });

      return NextResponse.json({ ok: true, clientToken });
    }

    if (isRecord(body) && body.action === "complete") {
      const session = await getSession();
      if (!session) {
        throw new Error("Login required.");
      }

      const exists = await candidateExists(id);
      if (!exists) {
        throw new Error("Candidate not found.");
      }

      const storageKey = typeof body.storageKey === "string" ? body.storageKey : "";
      const storageUrl = typeof body.storageUrl === "string" ? body.storageUrl : "";
      const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
      const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
      const sizeBytes = typeof body.sizeBytes === "number" ? body.sizeBytes : Number(body.sizeBytes);

      if (!storageKey.startsWith(`candidate-resumes/${id}/`)) {
        throw new Error("Invalid resume upload path.");
      }
      if (!storageUrl) {
        throw new Error("Resume upload did not return a file URL.");
      }
      if (!candidateResumeMimeTypes.includes(mimeType as (typeof candidateResumeMimeTypes)[number])) {
        throw new Error("Unsupported resume file type.");
      }
      if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > candidateResumeMaxSizeBytes) {
        throw new Error("Resume size is invalid.");
      }

      await addCandidateResume({
        candidateId: id,
        fileName: fileName || storageKey.split("/").pop() || "resume",
        mimeType,
        sizeBytes: Math.round(sizeBytes),
        storageKey,
        storageUrl
      });

      return NextResponse.json({ ok: true });
    }

    const uploadBody = body as HandleUploadBody;
    const json = await handleUpload({
      body: uploadBody,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await getSession();
        if (!session) {
          throw new Error("Login required.");
        }

        const exists = await candidateExists(id);
        if (!exists) {
          throw new Error("Candidate not found.");
        }

        if (!pathname.startsWith(`candidate-resumes/${id}/`)) {
          throw new Error("Invalid resume upload path.");
        }

        return {
          allowedContentTypes: [...candidateResumeMimeTypes],
          maximumSizeInBytes: candidateResumeMaxSizeBytes,
          addRandomSuffix: false,
          callbackUrl,
          tokenPayload: clientPayload
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        let fileName = blob.pathname.split("/").pop() || "resume";
        let sizeBytes = 0;
        try {
          const parsed = JSON.parse(tokenPayload ?? "{}") as { fileName?: string; sizeBytes?: number };
          if (parsed.fileName?.trim()) {
            fileName = parsed.fileName.trim();
          }
          if (typeof parsed.sizeBytes === "number" && Number.isFinite(parsed.sizeBytes)) {
            sizeBytes = Math.max(0, Math.round(parsed.sizeBytes));
          }
        } catch {
          // Keep the blob pathname fallback when client payload is absent or malformed.
        }

        try {
          await addCandidateResume({
            candidateId: id,
            fileName,
            mimeType: blob.contentType || "application/octet-stream",
            sizeBytes,
            storageKey: blob.pathname,
            storageUrl: blob.url
          });
        } catch (error) {
          console.error("Resume upload completion failed", {
            candidateId: id,
            storageKey: blob.pathname,
            error
          });
          throw error;
        }
      }
    });

    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not upload resume." },
      { status: 400 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
  }

  const { id } = await params;
  const exists = await candidateExists(id);
  if (!exists) {
    return NextResponse.json({ ok: false, message: "Candidate not found." }, { status: 404 });
  }

  const resume = await getLatestCandidateResume(id);
  return NextResponse.json({ ok: true, resume });
}
