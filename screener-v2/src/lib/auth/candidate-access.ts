import { NextResponse } from "next/server";
import type { AppAction } from "@/lib/auth/permissions";
import type { AppSession } from "@/lib/auth/session";
import { requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

type CandidatePermissionAction = Extract<AppAction, "view_candidates" | "manage_candidates" | "hire_candidate">;
type CandidatePermissionCandidate = {
  id: string;
  departmentId: string | null;
  orgStage: string | null;
};
type PermissionCheckResult =
  | { ok: true; candidate: CandidatePermissionCandidate }
  | { ok: false; response: NextResponse };

export async function requireCandidatePermission(
  session: AppSession,
  candidateId: string,
  action: CandidatePermissionAction
): Promise<PermissionCheckResult> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      departmentId: true,
      orgStage: true,
      departmentCandidacies: {
        where: { status: "active" },
        select: { departmentId: true },
        orderBy: { updatedAt: "desc" },
        take: 1
      }
    }
  });

  if (!candidate) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, message: "Candidate not found." }, { status: 404 })
    };
  }

  const scopedDepartmentId = candidate.departmentId ?? candidate.departmentCandidacies[0]?.departmentId ?? null;
  const result = await requirePermissionForDepartment(session, action, scopedDepartmentId);
  if (!result.ok) {
    return { ok: false, response: result.response };
  }
  return {
    ok: true,
    candidate: {
      id: candidate.id,
      departmentId: scopedDepartmentId,
      orgStage: candidate.orgStage
    }
  };
}
