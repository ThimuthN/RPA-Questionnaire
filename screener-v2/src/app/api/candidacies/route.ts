import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { createOrUpdateDepartmentCandidacy, validateCandidacyInputs } from "@/lib/db/candidacies";

const createCandidacySchema = z.object({
  candidateId: z.string().min(1, "Candidate ID required"),
  departmentId: z.string().min(1, "Department ID required"),
  roleId: z.string().min(1, "Role is required"),
  hrOwnerId: z.string().optional(),
  nominatedBy: z.string().optional(),
  nominationNote: z.string().optional(),
  jobPostingId: z.string().optional(),
  source: z.enum(["manual", "job_application", "nominated"]).optional()
});

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const { session } = auth;

  try {
    const body = await request.json();
    const input = createCandidacySchema.parse(body);

    const validation = await validateCandidacyInputs(input.candidateId, input.roleId, input.departmentId);
    if (!validation.ok) {
      const errorMessages = {
        candidate_not_found: ["Candidate not found", 404],
        candidate_finalized: ["Finalized candidates cannot be transferred.", 400],
        role_not_found: ["Role not found", 404],
        role_department_mismatch: ["Role must belong to the selected department.", 400],
      } as const;
      const [message, status] = errorMessages[validation.error.code];
      return NextResponse.json({ error: message }, { status });
    }

    const permission = await requirePermissionForDepartment(session, "manage_candidates", validation.candidateDepartmentId);
    if (!permission.ok) return permission.response;

    const candidacy = await createOrUpdateDepartmentCandidacy({
      candidateId: input.candidateId,
      departmentId: input.departmentId,
      roleId: input.roleId,
      hrOwnerId: input.hrOwnerId,
      nominatedBy: input.nominatedBy || (session.userId ?? undefined),
      nominatedByName: session.name || session.email || "System",
      nominationNote: input.nominationNote,
      jobPostingId: input.jobPostingId,
      source: (input.source || "manual") as "manual" | "job_application" | "nominated"
    });

    return NextResponse.json(candidacy);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create candidacy" },
      { status: 500 }
    );
  }
}
