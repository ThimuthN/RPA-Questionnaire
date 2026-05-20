import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import {
  candidateNextActionValues,
  candidateScreeningStatusValues,
  candidateStageValues,
  type CandidateStage,
  type CandidateNextAction
} from "@/lib/candidates/types";
import { updateCandidate } from "@/lib/db/candidates";
import { prisma } from "@/lib/db/prisma";

const updateCandidateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  roleId: z.string().optional(),
  departmentId: z.string().optional(),
  positionAppliedFor: z.string().optional(),
  batchId: z.string().optional(),
  resumeSource: z.string().optional(),
  hrOwner: z.string().optional(),
  hrOwnerId: z.string().optional(),
  stage: z.enum(candidateStageValues).optional(),
  nextAction: z.enum(candidateNextActionValues).optional(),
  screeningStatus: z.enum(candidateScreeningStatusValues).optional().or(z.literal("")),
  candidateFolderUrl: z.string().optional(),
  notesSummary: z.string().optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const body = updateCandidateSchema.parse(Object.fromEntries((await request.formData()).entries()));

    // Fetch current candidate to get existing stage/nextAction if not provided
    const current = await prisma.candidate.findUnique({
      where: { id },
      select: { stage: true, nextAction: true, departmentId: true, orgStage: true }
    });
    if (!current) {
      throw new Error("Candidate not found");
    }

    const permissionCheck = await requirePermissionForDepartment(auth.session, "manage_candidates", current.departmentId);
    if (!permissionCheck.ok) return permissionCheck.response;

    if (current.orgStage === "finalized") {
      throw new Error("Finalized candidates must be reverted before editing.");
    }

    // Validate foreign keys exist
    if (body.roleId) {
      const role = await prisma.roleCatalog.findUnique({
        where: { id: body.roleId },
        select: { id: true, departmentId: true }
      });
      if (!role) {
        throw new Error("Invalid roleId: role not found");
      }
      if (body.departmentId && role.departmentId !== body.departmentId) {
        throw new Error("Role must belong to the selected department.");
      }
    }

    if (body.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: body.departmentId },
        select: { id: true }
      });
      if (!dept) {
        throw new Error("Invalid departmentId: department not found");
      }
    }

    if (body.hrOwnerId) {
      const user = await prisma.user.findUnique({
        where: { id: body.hrOwnerId },
        select: { id: true }
      });
      if (!user) {
        throw new Error("Invalid hrOwnerId: user not found");
      }
    }

    await updateCandidate(id, {
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      roleId: body.roleId,
      departmentId: body.departmentId,
      positionAppliedFor: body.positionAppliedFor,
      batchId: body.batchId,
      resumeSource: body.resumeSource,
      hrOwner: body.hrOwner,
      hrOwnerId: body.hrOwnerId,
      candidateFolderUrl: body.candidateFolderUrl,
      notesSummary: body.notesSummary,
      stage: body.stage || (current.stage as CandidateStage),
      nextAction: body.nextAction || (current.nextAction as CandidateNextAction),
      screeningStatus: body.screeningStatus || undefined
    });

    const url = new URL(`/candidates/${id}`, request.url);
    url.searchParams.set("updated", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const { id } = await params;
    const url = new URL(`/candidates/${id}`, request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not update candidate.");
    return NextResponse.redirect(url, 303);
  }
}
