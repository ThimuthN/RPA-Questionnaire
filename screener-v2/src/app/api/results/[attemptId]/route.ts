import { NextResponse } from "next/server";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { getResult } from "@/lib/db/repositories";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

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

  const perm = await requirePermissionForDepartment(auth.session, "view_results", departmentId);
  if (!perm.ok) {
    return perm.response;
  }

  const row = await getResult(attemptId);
  if (!row) {
    return NextResponse.json({ ok: false, message: "Result not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, row });
}
