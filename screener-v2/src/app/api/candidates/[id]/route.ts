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
import { safeLocalPath } from "@/lib/http/safe-local-path";

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
  notesSummary: z.string().optional(),
  linkedInUrl: z.string().optional(),
  location: z.string().optional(),
  currentTitle: z.string().optional(),
  salaryExpectation: z.string().optional(),
  returnTo: z.string().optional()
});

function wantsJson(request: Request) {
  return request.headers.get("accept")?.includes("application/json") ?? false;
}

function redirectToCandidatePath(request: Request, candidateId: string, returnTo?: string, key = "updated", value = "1") {
  const safePath = safeLocalPath(returnTo) ?? `/people/candidates/${candidateId}`;
  const url = new URL(safePath, request.url);
  url.searchParams.set(key, value);
  return NextResponse.redirect(url, 303);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  let returnTo: string | undefined;
  try {
    const { id } = await params;
    const body = updateCandidateSchema.parse(Object.fromEntries((await request.formData()).entries()));
    returnTo = body.returnTo;

    // Fetch current candidate to get existing stage/nextAction if not provided
    const current = await prisma.candidate.findUnique({
      where: { id },
      select: { stage: true, nextAction: true, departmentId: true, roleId: true, orgStage: true }
    });
    if (!current) {
      throw new Error("Candidate not found");
    }

    const permissionCheck = await requirePermissionForDepartment(auth.session, "manage_candidates", current.departmentId);
    if (!permissionCheck.ok) return permissionCheck.response;

    if (current.orgStage === "finalized") {
      throw new Error("Finalized candidates must be reverted before editing.");
    }

    if (
      (body.departmentId && body.departmentId !== current.departmentId) ||
      (body.roleId && body.roleId !== current.roleId)
    ) {
      throw new Error("Use Transfer department to change a candidate's department or role.");
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
      linkedInUrl: body.linkedInUrl,
      location: body.location,
      currentTitle: body.currentTitle,
      salaryExpectation: body.salaryExpectation,
      stage: body.stage || (current.stage as CandidateStage),
      nextAction: body.nextAction || (current.nextAction as CandidateNextAction),
      screeningStatus: body.screeningStatus || undefined,
      actorId: auth.session.userId ?? undefined,
      actorName: auth.session.name || auth.session.email || "System"
    });

    if (wantsJson(request)) {
      return NextResponse.json({ ok: true });
    }

    return redirectToCandidatePath(request, id, returnTo, "updated", "1");
  } catch (error) {
    const { id } = await params;
    const message = error instanceof Error ? error.message : "Could not update candidate.";
    if (wantsJson(request)) {
      return NextResponse.json({ ok: false, message }, { status: 400 });
    }
    return redirectToCandidatePath(
      request,
      id,
      returnTo,
      "error",
      message
    );
  }
}
