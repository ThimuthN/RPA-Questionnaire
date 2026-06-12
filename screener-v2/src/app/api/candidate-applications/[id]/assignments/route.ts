import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import {
  applyHiringTeamTemplateToApplication,
  getApplicationAssignments,
  setApplicationAssignments
} from "@/lib/db/hiring-assignments";
import { prisma } from "@/lib/db/prisma";

const assignmentSchema = z.object({
  userId: z.string().min(1),
  assignmentRole: z.enum(["recruiter", "hiring_manager", "interviewer", "reviewer", "coordinator", "approver"]),
  isPrimary: z.boolean().optional()
});

const bodySchema = z.object({
  mode: z.enum(["add", "replace_role", "replace_all", "apply_template"]),
  assignments: z.array(assignmentSchema).optional(),
  templateId: z.string().min(1).optional()
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const { session } = auth;

  const { id } = await params;

  try {
    const application = await prisma.candidateApplication.findUnique({
      where: { id },
      select: { candidateId: true, candidate: { select: { departmentId: true } } }
    });

    if (!application) {
      return NextResponse.json({ ok: false, message: "Application not found" }, { status: 404 });
    }

    const permCheck = await requirePermissionForDepartment(session, "view_candidates", application.candidate.departmentId);
    if (!permCheck.ok) {
      return NextResponse.json({ ok: false, message: "Not authorized" }, { status: 403 });
    }

    const assignments = await getApplicationAssignments(id);
    return NextResponse.json({ ok: true, assignments });
  } catch (error) {
    console.error("[assignments-get]", error);
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
  const { session } = auth;

  const { id } = await params;

  try {
    const body = bodySchema.parse(await request.json());

    if (body.mode === "apply_template" && !body.templateId) {
      return NextResponse.json({ ok: false, message: "Template is required" }, { status: 400 });
    }

    if (body.mode !== "apply_template" && (!body.assignments || body.assignments.length === 0)) {
      return NextResponse.json({ ok: false, message: "Assignments are required" }, { status: 400 });
    }

    const application = await prisma.candidateApplication.findUnique({
      where: { id },
      select: { candidateId: true, candidate: { select: { departmentId: true } } }
    });

    if (!application) {
      return NextResponse.json({ ok: false, message: "Application not found" }, { status: 404 });
    }

    const permCheck = await requirePermissionForDepartment(session, "manage_candidates", application.candidate.departmentId);
    if (!permCheck.ok) {
      return NextResponse.json({ ok: false, message: "Not authorized to manage assignments" }, { status: 403 });
    }

    const result =
      body.mode === "apply_template"
        ? await applyHiringTeamTemplateToApplication(id, body.templateId || "", session.userId || undefined)
        : await setApplicationAssignments(
            id,
            body.mode,
            body.assignments ?? [],
            session.userId || undefined
          );

    const assignments = await getApplicationAssignments(id);
    return NextResponse.json({
      ok: true,
      result,
      assignments
    });
  } catch (error) {
    console.error("[assignments-put]", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
