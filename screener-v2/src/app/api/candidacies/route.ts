import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { createOrUpdateDepartmentCandidacy } from "@/lib/db/candidacies";

const createCandidacySchema = z.object({
  candidateId: z.string().min(1, "Candidate ID required"),
  departmentId: z.string().min(1, "Department ID required"),
  roleId: z.string().optional(),
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

    const candidacy = await createOrUpdateDepartmentCandidacy({
      candidateId: input.candidateId,
      departmentId: input.departmentId,
      roleId: input.roleId,
      hrOwnerId: input.hrOwnerId,
      nominatedBy: input.nominatedBy || (session.userId ?? undefined),
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
