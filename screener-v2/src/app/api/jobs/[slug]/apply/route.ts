import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { z } from "zod";
import {
  assertCandidateResumeMimeType,
  assertCandidateResumeSize,
  persistCandidateResumeUpload
} from "@/lib/candidates/resume-storage";
import { normalizeResumeFileName } from "@/lib/candidates/resume-config";
import { createCandidateApplicationFromPublicSubmission } from "@/lib/db/jobs";

const publicApplySchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  coverNote: z.string().optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const formData = await request.formData();
    const body = publicApplySchema.parse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      coverNote: formData.get("coverNote")
    });
    const file = formData.get("resume");

    if (file instanceof File && file.size > 0) {
      assertCandidateResumeMimeType(file.type);
      assertCandidateResumeSize(file.size);
    }

    const submission = await createCandidateApplicationFromPublicSubmission({
      jobSlug: slug,
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      coverNote: body.coverNote
    });

    const url = new URL(`/jobs/${slug}`, request.url);

    if (submission.status === "duplicate") {
      url.searchParams.set("alreadyApplied", "1");
      return NextResponse.redirect(url, 303);
    }

    if (file instanceof File && file.size > 0) {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const storageKey = `candidate-resumes/${submission.candidateId}/${stamp}-${normalizeResumeFileName(file.name)}`;

      try {
        const blob = await put(storageKey, file, {
          access: "private",
          addRandomSuffix: false,
          contentType: file.type
        });

        try {
          await persistCandidateResumeUpload({
            candidateId: submission.candidateId,
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
      } catch {
        url.searchParams.set("applied", "1");
        url.searchParams.set("resumeError", "1");
        return NextResponse.redirect(url, 303);
      }
    }

    url.searchParams.set("applied", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL(`/jobs/${slug}`, request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not submit application.");
    return NextResponse.redirect(url, 303);
  }
}
