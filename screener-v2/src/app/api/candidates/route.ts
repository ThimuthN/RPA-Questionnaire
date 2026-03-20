import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import {
  candidateFinalDecisionValues,
  candidateNextActionValues,
  candidateScreeningStatusValues,
  candidateStageValues
} from "@/lib/candidates/types";
import { addCandidateResume, createCandidate } from "@/lib/db/candidates";
import { uploadResume } from "@/lib/storage/resumes";

const candidateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  positionAppliedFor: z.string().optional(),
  batchId: z.string().optional(),
  resumeSource: z.string().optional(),
  hrOwner: z.string().optional(),
  stage: z.enum(candidateStageValues).default("new"),
  finalDecision: z.enum(candidateFinalDecisionValues).default("in_process"),
  nextAction: z.enum(candidateNextActionValues).default("none"),
  screeningStatus: z.enum(candidateScreeningStatusValues).optional().or(z.literal("")),
  candidateFolderUrl: z.string().optional(),
  notesSummary: z.string().optional()
});

function isFormRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
  }

  let createdCandidateId: string | null = null;

  try {
    const formRequest = isFormRequest(request);
    const formData = formRequest ? await request.formData() : null;
    const rawBody = formData
      ? Object.fromEntries([...formData.entries()].filter(([key]) => key !== "resume"))
      : await request.json();
    const body = candidateSchema.parse(rawBody);
    const candidate = await createCandidate({
      ...body,
      screeningStatus: body.screeningStatus || undefined
    });
    createdCandidateId = candidate.id;

    const resume = formData?.get("resume");
    if (resume instanceof File && resume.size > 0) {
      const uploaded = await uploadResume(candidate.id, resume);
      await addCandidateResume({
        candidateId: candidate.id,
        ...uploaded
      });
    }

    if (formRequest) {
      const url = new URL(`/candidates/${candidate.id}`, request.url);
      url.searchParams.set("created", "1");
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json({ ok: true, candidate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create candidate.";

    if (createdCandidateId) {
      const url = new URL(`/candidates/${createdCandidateId}`, request.url);
      url.searchParams.set("error", message);
      return NextResponse.redirect(url, 303);
    }

    if (isFormRequest(request)) {
      const url = new URL("/candidates/new", request.url);
      url.searchParams.set("error", message);
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
