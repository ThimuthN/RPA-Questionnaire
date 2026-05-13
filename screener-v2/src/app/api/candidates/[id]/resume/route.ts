import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { requireApiSession } from "@/lib/auth/guards";
import {
  getLatestCandidateResume,
  initOrUpdateMilestoneCheck
} from "@/lib/db/candidates";
import { prisma } from "@/lib/db/prisma";
import {
  assertCandidateResumeCandidateExists,
  assertCandidateResumeMimeType,
  assertCandidateResumeSize,
  assertCandidateResumeStorageKey,
  persistCandidateResumeUpload
} from "@/lib/candidates/resume-storage";
import {
  createRequestLogContext,
  logRouteError,
  messageFromError
} from "@/lib/server/logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const logContext = createRequestLogContext(request, "api.candidates.resume", {
    candidateId: id
  });
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      throw new Error("Resume upload must use multipart form data.");
    }

    await assertCandidateResumeCandidateExists(id);

    const formData = await request.formData();
    const action = formData.get("action");
    const pathname = typeof formData.get("pathname") === "string" ? String(formData.get("pathname")) : "";
    const file = formData.get("file");

    if (action !== "upload") {
      throw new Error("Invalid upload action.");
    }

    if (!(file instanceof File)) {
      throw new Error("Choose a resume file first.");
    }

    assertCandidateResumeStorageKey(id, pathname);
    assertCandidateResumeMimeType(file.type);
    assertCandidateResumeSize(file.size);

    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: false,
      contentType: file.type
    });

    let resume;
    try {
      resume = await persistCandidateResumeUpload({
        candidateId: id,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storageKey: blob.pathname,
        storageUrl: blob.url
      });
    } catch (error) {
      await del(blob.pathname);
      throw error;
    }

    try {
      const registrationMilestone = await prisma.candidateMilestone.findFirst({
        where: {
          candidateId: id,
          type: "registration"
        },
        select: { id: true }
      });

      if (registrationMilestone) {
        const userEmail = auth.value.email || "system";
        const userName = auth.value.name || "System";
        await initOrUpdateMilestoneCheck(
          id,
          registrationMilestone.id,
          "resume_upload",
          "passed",
          undefined,
          auth.value.id,
          userName
        );
      }
    } catch (checkError) {
      logRouteError("registration_check_failed", logContext, checkError);
    }

    return NextResponse.json({ ok: true, resume });
  } catch (error) {
    logRouteError("candidate_resume_failed", logContext, error);

    return NextResponse.json(
      {
        ok: false,
        message: messageFromError(error, "Could not upload resume."),
        requestId: logContext.requestId
      },
      { status: 400 }
    );
  }
}

export async function GET(
  _request: Request,
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

  const resume = await getLatestCandidateResume(id);
  return NextResponse.json({ ok: true, resume });
}
