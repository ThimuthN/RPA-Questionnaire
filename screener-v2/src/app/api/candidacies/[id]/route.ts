import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { updateDepartmentCandidacyStatus } from "@/lib/db/candidacies";

const updateCandidacySchema = z.object({
  status: z.enum(["active", "talent_pool", "dept_rejected"]).optional(),
  hrOwnerId: z.string().optional(),
  roleId: z.string().optional(),
  nominationNote: z.string().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const { session } = auth;

  const { id: candidacyId } = await params;

  try {
    // Get the candidacy to check permissions
    const candidacy = await prisma.departmentCandidacy.findUnique({
      where: { id: candidacyId },
      select: { departmentId: true }
    });

    if (!candidacy) {
      return NextResponse.json(
        { error: "Candidacy not found" },
        { status: 404 }
      );
    }

    // Check permission: admin/recruiter can manage; hiring_manager restricted by departmentId (future)
    const canManage =
      session.accessLevel === "admin" ||
      session.accessLevel === "recruiter";

    if (!canManage) {
      return NextResponse.json(
        { error: "Not authorized to update this candidacy" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const input = updateCandidacySchema.parse(body);

    let updated;
    if (input.status) {
      updated = await updateDepartmentCandidacyStatus(
        candidacyId,
        input.status,
        session.userId ?? undefined
      );
    } else {
      // Update other fields
      updated = await prisma.departmentCandidacy.update({
        where: { id: candidacyId },
        data: {
          ...(input.hrOwnerId && { hrOwnerId: input.hrOwnerId }),
          ...(input.roleId && { roleId: input.roleId }),
          ...(input.nominationNote !== undefined && { nominationNote: input.nominationNote }),
          updatedAt: new Date()
        },
        include: {
          department: { select: { name: true } },
          role: { select: { label: true } }
        }
      });

      return NextResponse.json({
        id: updated.id,
        candidateId: updated.candidateId,
        departmentId: updated.departmentId,
        roleId: updated.roleId ?? undefined,
        hrOwnerId: updated.hrOwnerId ?? undefined,
        status: updated.status,
        departmentName: updated.department.name,
        roleName: updated.role?.label ?? undefined,
        updatedAt: updated.updatedAt.toISOString()
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update candidacy" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id: candidacyId } = await params;

  try {
    const candidacy = await prisma.departmentCandidacy.findUnique({
      where: { id: candidacyId }
    });

    if (!candidacy) {
      return NextResponse.json(
        { error: "Candidacy not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of job_application candidacies
    if (candidacy.source === "job_application") {
      return NextResponse.json(
        { error: "Cannot delete candidacies from job applications" },
        { status: 400 }
      );
    }

    await prisma.departmentCandidacy.delete({
      where: { id: candidacyId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete candidacy" },
      { status: 500 }
    );
  }
}
