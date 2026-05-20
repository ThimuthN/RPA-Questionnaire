import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import {
  candidateNextActionValues,
  candidateScreeningStatusValues,
  candidateStageValues
} from "@/lib/candidates/types";
import { createCandidate, findExistingCandidateByEmail } from "@/lib/db/candidates";
import { isFormRequest } from "@/lib/http/request";
import {
  createRequestLogContext,
  logRouteError,
  messageFromError
} from "@/lib/server/logger";
import { prisma } from "@/lib/db/prisma";

const candidateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  roleId: z.string().optional(),
  departmentId: z.string().min(1, "Choose a department."),
  positionAppliedFor: z.string().optional(),
  batchId: z.string().optional(),
  resumeSource: z.string().optional(),
  hrOwner: z.string().optional(),
  hrOwnerId: z.string().optional(),
  stage: z.enum(candidateStageValues).default("pipeline"),
  nextAction: z.enum(candidateNextActionValues).default("none"),
  screeningStatus: z.enum(candidateScreeningStatusValues).optional().or(z.literal("")),
  candidateFolderUrl: z.string().optional(),
  notesSummary: z.string().optional()
});

export async function POST(request: Request) {
  const logContext = createRequestLogContext(request, "api.candidates.create");
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const { session } = auth;

  const formRequest = isFormRequest(request);
  const rawBody = formRequest ? Object.fromEntries((await request.formData()).entries()) : await request.json();

  try {
    const body = candidateSchema.parse(rawBody);

    if (!body.roleId) {
      throw new Error("Choose a role for this candidate.");
    }

    const permissionCheck = await requirePermissionForDepartment(auth.session, "manage_candidates", body.departmentId);
    if (!permissionCheck.ok) return permissionCheck.response;

    const [role, dept] = await Promise.all([
      prisma.roleCatalog.findUnique({
        where: { id: body.roleId },
        select: { id: true, departmentId: true }
      }),
      prisma.department.findUnique({
        where: { id: body.departmentId },
        select: { id: true }
      })
    ]);

    if (!role) {
      throw new Error("Invalid roleId: role not found");
    }
    if (!dept) {
      throw new Error("Invalid departmentId: department not found");
    }
    if (role.departmentId !== body.departmentId) {
      throw new Error("Role must belong to the selected department.");
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
    const candidate = await createCandidate({
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
      stage: body.stage,
      nextAction: body.nextAction,
      screeningStatus: body.screeningStatus || undefined
    });

    if (formRequest) {
      const url = new URL(`/candidates/${candidate.id}`, request.url);
      url.searchParams.set("created", "1");
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json({ ok: true, candidate });
  } catch (error) {
    logRouteError("candidate_create_failed", logContext, error, {
      userId: session.userId
    });

    const message = messageFromError(error, "Could not create candidate.");

    if (formRequest) {
      const url = new URL("/candidates/new", request.url);
      url.searchParams.set("error", message);
      url.searchParams.set("requestId", logContext.requestId);
      const email = String((rawBody as Record<string, unknown>)?.email || "").trim().toLowerCase();
      if (email) {
        const existing = await findExistingCandidateByEmail(email);
        if (existing) {
          url.searchParams.set("existingId", existing.id);
          url.searchParams.set("existingName", existing.fullName);
          url.searchParams.set("existingEmail", existing.email);
        }
      }
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json({ ok: false, message, requestId: logContext.requestId }, { status: 400 });
  }
}
