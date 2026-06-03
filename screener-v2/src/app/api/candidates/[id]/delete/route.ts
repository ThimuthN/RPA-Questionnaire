import { NextResponse } from "next/server";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { deleteCandidate } from "@/lib/db/candidates";
import { prisma } from "@/lib/db/prisma";

function redirectUrl(request: Request, formData?: FormData) {
  const returnTo = String(formData?.get("returnTo") || "").trim();
  return new URL(returnTo.startsWith("/") ? returnTo : "/people/candidates", request.url);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const { id } = await context.params;

    // Fetch candidate with related data to validate delete constraints
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: {
        id: true,
        stage: true,
        departmentId: true,
        employee: true,
        offer: true,
        interviewPanels: { select: { id: true } },
        milestones: { where: { status: { not: "done" } }, select: { id: true } }
      }
    });

    if (!candidate) {
      const url = redirectUrl(request, formData);
      url.searchParams.set("error", "Candidate not found");
      return NextResponse.redirect(url, 303);
    }

    const permissionCheck = await requirePermissionForDepartment(auth.session, "delete_candidate", candidate.departmentId);
    if (!permissionCheck.ok) {
      return permissionCheck.response;
    }

    // Validation: Cannot delete hired candidates
    if (candidate.stage === "finalized") {
      const url = redirectUrl(request, formData);
      url.searchParams.set("error", "Cannot delete a finalized candidate. Please terminate the employee record first.");
      return NextResponse.redirect(url, 303);
    }

    // Validation: Cannot delete if employee exists
    if (candidate.employee) {
      const url = redirectUrl(request, formData);
      url.searchParams.set("error", "Cannot delete candidate with an active employee record. Terminate the employee first.");
      return NextResponse.redirect(url, 303);
    }

    // Validation: Cannot delete with pending offer
    if (candidate.offer) {
      const url = redirectUrl(request, formData);
      url.searchParams.set("error", "Cannot delete candidate with pending offer. Reject or expire offer first.");
      return NextResponse.redirect(url, 303);
    }

    // Validation: Cannot delete with active interview panels
    if (candidate.interviewPanels.length > 0) {
      const url = redirectUrl(request, formData);
      url.searchParams.set("error", "Cannot delete candidate with scheduled interview panels. Complete or cancel interviews first.");
      return NextResponse.redirect(url, 303);
    }

    // Validation: Cannot delete with active milestones
    if (candidate.milestones.length > 0) {
      const url = redirectUrl(request, formData);
      url.searchParams.set("error", "Cannot delete candidate with active milestones. Complete all milestones first.");
      return NextResponse.redirect(url, 303);
    }

    // All checks passed, proceed with deletion
    await deleteCandidate(id);

    const url = redirectUrl(request, formData);
    url.searchParams.set("deleted", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL("/people/candidates", request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not delete candidate.");
    return NextResponse.redirect(url, 303);
  }
}
