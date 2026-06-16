import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";
import { z } from "zod";
import {
  assertCandidateResumeMimeType,
  assertCandidateResumeSize,
  persistCandidateResumeUpload
} from "@/lib/candidates/resume-storage";
import { normalizeResumeFileName } from "@/lib/candidates/resume-config";
import {
  beginPublicApplicationScreeningFlow,
  createCandidateApplicationFromPublicSubmission,
  publicApplicationScreeningSlug,
  type PublicApplicationSource
} from "@/lib/db/jobs";
import {
  createRuntimeSessionToken,
  setRuntimeSessionCookie
} from "@/lib/auth/runtime-session";
import { checkPublicApplicationRateLimit } from "@/lib/server/rate-limit";
import { PUBLIC_JOBS_ENABLED } from "@/lib/jobs/public-access";
import { CANDIDATE_PRIVACY_POLICY_VERSION } from "@/lib/legal/site-policy";
import { sendEmailSafe, applicationReceivedEmail, getOrgName } from "@/lib/email";
import { createNotificationForMany } from "@/lib/notifications/service";
import { prisma } from "@/lib/db/prisma";
import { logError } from "@/lib/server/logger";

const SOURCE_VALUES: PublicApplicationSource[] = [
  "direct", "linkedin", "job_board", "referral", "agency", "other"
];

const publicApplySchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  currentTitle: z.string().optional(),
  location: z.string().optional(),
  linkedInUrl: z.string().optional(),
  salaryExpectation: z.string().optional(),
  coverNote: z.string().optional(),
  source: z.string().optional(),
  referredBy: z.string().optional(),
  consentGiven: z.literal("on", {
    errorMap: () => ({ message: "You must agree to data processing before submitting." })
  })
});

function optionalTextEntry(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : undefined;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!PUBLIC_JOBS_ENABLED) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { id: slug } = await params;

  try {
    const formData = await request.formData();
    const body = publicApplySchema.parse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: optionalTextEntry(formData.get("phone")),
      currentTitle: optionalTextEntry(formData.get("currentTitle")),
      location: optionalTextEntry(formData.get("location")),
      linkedInUrl: optionalTextEntry(formData.get("linkedInUrl")),
      salaryExpectation: optionalTextEntry(formData.get("salaryExpectation")),
      coverNote: optionalTextEntry(formData.get("coverNote")),
      source: optionalTextEntry(formData.get("source")),
      referredBy: optionalTextEntry(formData.get("referredBy")),
      consentGiven: formData.get("consentGiven")
    });

    const rawSource = body.source ?? new URL(request.url).searchParams.get("utm_source") ?? "";
    const applicationSource: PublicApplicationSource =
      SOURCE_VALUES.includes(rawSource as PublicApplicationSource)
        ? (rawSource as PublicApplicationSource)
        : "direct";
    const publicRateLimit = await checkPublicApplicationRateLimit({
      request,
      jobSlug: slug,
      email: body.email
    });
    if (!publicRateLimit.ok) {
      throw new Error(publicRateLimit.message);
    }
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
      currentTitle: body.currentTitle,
      location: body.location,
      linkedInUrl: body.linkedInUrl,
      salaryExpectation: body.salaryExpectation,
      coverNote: body.coverNote,
      consentGivenAt: new Date(),
      consentVersion: CANDIDATE_PRIVACY_POLICY_VERSION,
      source: applicationSource,
      referredBy: applicationSource === "referral" ? body.referredBy?.trim() || undefined : undefined,
    });

    const url = new URL(`/jobs/${slug}/apply`, request.url);

    if (submission.status === "duplicate") {
      if (submission.screeningAttemptId) {
        const screeningUrl = new URL(
          `/jobs/${slug}/apply/screening/${submission.applicationId}`,
          request.url
        );
        const response = NextResponse.redirect(screeningUrl, 303);
        const runtimeToken = await createRuntimeSessionToken({
          attemptId: submission.screeningAttemptId,
          slug: publicApplicationScreeningSlug(submission.applicationId)
        });
        setRuntimeSessionCookie(response, runtimeToken);
        return response;
      }

      url.searchParams.set("alreadyApplied", "1");
      url.searchParams.set("applicationId", submission.applicationId);
      return NextResponse.redirect(url, 303);
    }

    let resumeUploadFailed = false;
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
        resumeUploadFailed = true;
      }
    }

    const { subject, html } = applicationReceivedEmail({
      orgName: getOrgName(),
      candidateName: body.fullName,
      roleTitle: submission.jobTitle ?? slug,
      applicationDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    });
    sendEmailSafe({
      to: body.email,
      subject,
      html,
      template: "application_received",
      candidateId: submission.candidateId
    }).catch((err: unknown) => {
      logError("application_received_email_failed", { email: body.email, candidateId: submission.candidateId, error: err instanceof Error ? err.message : String(err) });
    });

    // Notify hiring team members in the job's department
    if (submission.departmentId) {
      void (async () => {
        try {
          const grants = await prisma.accessGrant.findMany({
            where: {
              departmentId: submission.departmentId!,
              scope: "department",
              status: "active",
            },
            select: {
              userId: true,
              role: { select: { permissions: { select: { permission: true } } } },
            },
          });
          const recipientIds = grants
            .filter((g) =>
              g.role.permissions.some((p) => p.permission === "manage_candidates")
            )
            .map((g) => g.userId);
          if (recipientIds.length > 0) {
            await createNotificationForMany(recipientIds, {
              type: "new_applicant",
              title: `New applicant: ${body.fullName}`,
              body: `Applied for ${submission.jobTitle}`,
              entityType: "candidate",
              entityId: submission.candidateId,
              entityHref: `/people/candidates/${submission.candidateId}`,
            });
          }
        } catch (err: unknown) {
          logError("new_applicant_notification_failed", { candidateId: submission.candidateId, error: err instanceof Error ? err.message : String(err) });
        }
      })();
    }

    if (submission.requiresScreening) {
      const screeningFlow = await beginPublicApplicationScreeningFlow({
        applicationId: submission.applicationId
      });

      if (screeningFlow) {
        const screeningUrl = new URL(
          `/jobs/${slug}/apply/screening/${submission.applicationId}`,
          request.url
        );
        if (resumeUploadFailed) {
          screeningUrl.searchParams.set("resumeError", "1");
        }

        const response = NextResponse.redirect(screeningUrl, 303);
        const runtimeToken = await createRuntimeSessionToken({
          attemptId: screeningFlow.attemptId,
          slug: screeningFlow.runtimeSlug
        });
        setRuntimeSessionCookie(response, runtimeToken);
        return response;
      }
    }

    url.searchParams.set("submitted", "1");
    url.searchParams.set("applicationId", submission.applicationId);
    if (resumeUploadFailed) {
      url.searchParams.set("resumeError", "1");
    }
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL(`/jobs/${slug}/apply`, request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not submit application.");
    return NextResponse.redirect(url, 303);
  }
}
