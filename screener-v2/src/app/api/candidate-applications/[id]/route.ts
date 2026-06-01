import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { canUsePermissionForDepartment } from "@/lib/auth/permission-evaluator";
import { updateCandidateApplicationLifecycle } from "@/lib/db/jobs";
import { prisma } from "@/lib/db/prisma";

const actionSchema = z.object({
  action: z.enum(["review", "promote", "close"]),
  hrOwner: z.string().optional(),
  returnTo: z.string().optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const { session } = auth;

  const { id } = await params;

  try {
    const body = actionSchema.parse(Object.fromEntries((await request.formData()).entries()));

    const application = await prisma.candidateApplication.findUnique({
      where: { id },
      select: {
        id: true,
        candidateId: true,
        candidate: { select: { departmentId: true } }
      }
    });

    if (!application) {
      const url = new URL("/people/candidates/applicants", request.url);
      url.searchParams.set("error", "Application not found.");
      return NextResponse.redirect(url, 303);
    }

    if (body.action === "review" || body.action === "close") {
      const permCheck = await requirePermissionForDepartment(session, "manage_candidates", application.candidate.departmentId);
      if (!permCheck.ok) {
        const url = new URL("/people/candidates/applicants", request.url);
        url.searchParams.set("error", "Not authorized to manage this application.");
        return NextResponse.redirect(url, 303);
      }
    } else if (body.action === "promote") {
      const canPromote = await canUsePermissionForDepartment(session, "promote_candidate", application.candidate.departmentId) || await canUsePermissionForDepartment(session, "manage_candidates", application.candidate.departmentId);
      if (!canPromote) {
        const url = new URL("/people/candidates/applicants", request.url);
        url.searchParams.set("error", "Not authorized to move this applicant to the pipeline.");
        return NextResponse.redirect(url, 303);
      }
    }

    const result = await updateCandidateApplicationLifecycle({
      applicationId: id,
      action: body.action,
      hrOwner: body.hrOwner
    });

    const redirectTo = body.returnTo?.trim() || `/candidates/${result.candidateId}`;
    const url = new URL(redirectTo.startsWith("/") ? redirectTo : `/candidates/${result.candidateId}`, request.url);
    url.searchParams.set("updated", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL("/people/candidates/applicants", request.url);
    url.searchParams.set("error", "Could not update application.");
    return NextResponse.redirect(url, 303);
  }
}
