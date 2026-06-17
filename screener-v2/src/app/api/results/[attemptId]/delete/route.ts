import { NextResponse } from "next/server";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { deleteResultAttempt } from "@/lib/db/repositories";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { attemptId } = await context.params;

    const attemptData = await prisma.attempt.findUnique({
      where: { id: attemptId },
      select: {
        candidateAssessment: {
          select: { candidate: { select: { departmentId: true } } }
        }
      }
    });
    const departmentId = attemptData?.candidateAssessment?.candidate?.departmentId ?? null;

    const perm = await requirePermissionForDepartment(auth.session, "delete_candidate", departmentId);
    if (!perm.ok) {
      const url = new URL("/results", request.url);
      url.searchParams.set("error", "Permission denied.");
      return NextResponse.redirect(url, 303);
    }

    await deleteResultAttempt(attemptId);

    const url = new URL("/results", request.url);
    url.searchParams.set("deleted", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL("/results", request.url);
    url.searchParams.set("error", "Could not delete result.");
    return NextResponse.redirect(url, 303);
  }
}
