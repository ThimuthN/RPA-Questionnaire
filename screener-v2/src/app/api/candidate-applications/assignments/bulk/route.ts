import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { bulkAssignApplications } from "@/lib/db/hiring-assignments";
import { prisma } from "@/lib/db/prisma";

const assignmentSchema = z.object({
  userId: z.string().min(1),
  assignmentRole: z.enum(["recruiter", "hiring_manager", "interviewer", "reviewer", "coordinator", "approver"]),
  isPrimary: z.boolean().optional()
});

const bodySchema = z.object({
  applicationIds: z.array(z.string().min(1)),
  mode: z.enum(["add", "replace_role"]),
  assignments: z.array(assignmentSchema)
});

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const { session } = auth;

  try {
    const body = bodySchema.parse(await request.json());

    const applications = await prisma.candidateApplication.findMany({
      where: { id: { in: body.applicationIds } },
      select: { id: true, candidate: { select: { departmentId: true } } }
    });

    if (applications.length === 0) {
      return NextResponse.json({ ok: false, message: "No applications found" }, { status: 404 });
    }

    const departmentIds = new Set(
      applications.map((a) => a.candidate.departmentId).filter((id): id is string => Boolean(id))
    );

    // Check permission for all affected departments
    for (const deptId of departmentIds) {
      const permCheck = await requirePermissionForDepartment(session, "manage_candidates", deptId);
      if (!permCheck.ok) {
        return NextResponse.json(
          { ok: false, message: `Not authorized to manage candidates in department ${deptId}` },
          { status: 403 }
        );
      }
    }

    const result = await bulkAssignApplications(body.applicationIds, body.mode, body.assignments, session.userId || undefined);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[bulk-assignments-post]", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
