import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import {
  copyTemplateToCandicacy,
  getCandidacyTeamAssignments,
  replaceCandidacyTeamAssignments
} from "@/lib/db/candidacy-team-assignments";
import { prisma } from "@/lib/db/prisma";

const assignmentSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["owner", "recruiter", "hiring_manager", "interviewer", "reviewer", "final_approver"]),
  isPrimary: z.boolean().optional()
});

const bodySchema = z.object({
  mode: z.enum(["replace_all", "apply_template"]),
  assignments: z.array(assignmentSchema).optional(),
  templateId: z.string().min(1).optional()
});

async function getCandidacyOr404(id: string) {
  return prisma.departmentCandidacy.findUnique({
    where: { id },
    select: { id: true, departmentId: true }
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  try {
    const candidacy = await getCandidacyOr404(id);
    if (!candidacy) {
      return NextResponse.json({ ok: false, message: "Candidacy not found" }, { status: 404 });
    }

    const permCheck = await requirePermissionForDepartment(
      auth.session,
      "view_candidates",
      candidacy.departmentId
    );
    if (!permCheck.ok) {
      return NextResponse.json({ ok: false, message: "Not authorized" }, { status: 403 });
    }

    const assignments = await getCandidacyTeamAssignments(id);
    return NextResponse.json({ ok: true, assignments });
  } catch (error) {
    console.error("[candidacy-assignments-get]", error);
    return NextResponse.json({ ok: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;

  try {
    const body = bodySchema.parse(await request.json());
    const candidacy = await getCandidacyOr404(id);
    if (!candidacy) {
      return NextResponse.json({ ok: false, message: "Candidacy not found" }, { status: 404 });
    }

    const permCheck = await requirePermissionForDepartment(
      auth.session,
      "manage_candidates",
      candidacy.departmentId
    );
    if (!permCheck.ok) {
      return NextResponse.json({ ok: false, message: "Not authorized to manage assignments" }, { status: 403 });
    }

    if (body.mode === "apply_template") {
      if (!body.templateId) {
        return NextResponse.json({ ok: false, message: "Template is required" }, { status: 400 });
      }

      const assignments = await copyTemplateToCandicacy(id, body.templateId, auth.session.userId || undefined);
      return NextResponse.json({ ok: true, assignments });
    }

    if (!body.assignments || body.assignments.length === 0) {
      return NextResponse.json({ ok: false, message: "Assignments are required" }, { status: 400 });
    }

    const assignments = await replaceCandidacyTeamAssignments(
      id,
      body.assignments.map((assignment) => ({
        candidacyId: id,
        userId: assignment.userId,
        role: assignment.role,
        source: "manual",
        isPrimary: assignment.isPrimary
      })),
      auth.session.userId || undefined
    );

    return NextResponse.json({ ok: true, assignments });
  } catch (error) {
    console.error("[candidacy-assignments-put]", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
