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

const teamAssignmentSchema = z.object({
  userId: z.string(),
  role: z.enum(["owner", "recruiter", "hiring_manager", "interviewer", "reviewer", "final_approver"])
});

const candidateSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  roleId: z.string().optional(),
  departmentId: z.string().min(1, "Choose a department."),
  positionAppliedFor: z.string().optional(),
  batchId: z.string().optional(),
  resumeSource: z.string().optional(),
  hrOwnerId: z.string().optional(),
  stage: z.enum(candidateStageValues).default("pipeline"),
  nextAction: z.enum(candidateNextActionValues).default("none"),
  screeningStatus: z.enum(candidateScreeningStatusValues).optional().or(z.literal("")),
  candidateFolderUrl: z.string().optional(),
  notesSummary: z.string().optional(),
  teamTemplateId: z.string().optional().or(z.literal("")),
  teamUserIds: z.array(teamAssignmentSchema).optional()
});

function normalizeCandidateBody(rawBody: Record<string, unknown>) {
  const nextBody: Record<string, unknown> = { ...rawBody };
  const rawTeamAssignments = rawBody.teamUserIds;

  if (typeof rawTeamAssignments === "string") {
    const trimmed = rawTeamAssignments.trim();
    nextBody.teamUserIds = trimmed ? JSON.parse(trimmed) : [];
  }

  return candidateSchema.parse(nextBody);
}

export async function POST(request: Request) {
  const logContext = createRequestLogContext(request, "api.candidates.create");
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const { session } = auth;

  const formRequest = isFormRequest(request);
  const rawBody = formRequest
    ? Object.fromEntries((await request.formData()).entries())
    : ((await request.json()) as Record<string, unknown>);

  try {
    const body = normalizeCandidateBody(rawBody);

    if (!body.roleId) {
      throw new Error("Choose a job designation for this candidate.");
    }

    const permissionCheck = await requirePermissionForDepartment(auth.session, "manage_candidates", body.departmentId);
    if (!permissionCheck.ok) return permissionCheck.response;

    const [role, department, teamUsers] = await Promise.all([
      prisma.roleCatalog.findUnique({
        where: { id: body.roleId },
        select: { id: true, departmentId: true, kind: true }
      }),
      prisma.department.findUnique({
        where: { id: body.departmentId },
        select: { id: true }
      }),
      prisma.accessGrant.findMany({
        where: {
          departmentId: body.departmentId,
          scope: "department",
          status: "active",
          user: {
            is: {
              isActive: true
            }
          }
        },
        select: {
          userId: true
        }
      })
    ]);

    if (!role) {
      throw new Error("Invalid roleId: role not found");
    }
    if (role.kind !== "job_designation") {
      throw new Error("Candidates must be registered against a job designation.");
    }
    if (!department) {
      throw new Error("Invalid departmentId: department not found");
    }
    if (role.departmentId !== body.departmentId) {
      throw new Error("Job designation must belong to the selected department.");
    }

    const availableTeamUserIds = new Set(teamUsers.map((grant) => grant.userId));
    if (availableTeamUserIds.size === 0) {
      throw new Error(`No team members found in this department. Add team members at /departments/${body.departmentId}/users first.`);
    }

    let normalizedAssignments: Array<{
      userId: string;
      role: "owner" | "recruiter" | "hiring_manager" | "interviewer" | "reviewer" | "final_approver";
      source: "template" | "manual";
      templateId?: string;
    }> = [];

    if (body.teamTemplateId) {
      const template = await prisma.hiringTeamTemplate.findFirst({
        where: {
          id: body.teamTemplateId,
          departmentId: body.departmentId,
          isActive: true
        },
        include: {
          members: {
            select: {
              userId: true,
              role: true
            }
          }
        }
      });

      if (!template) {
        throw new Error("Selected hiring team template was not found.");
      }

      if (!template.members.some((member) => member.role === "owner")) {
        throw new Error("Selected hiring team template must include at least one owner.");
      }

      normalizedAssignments = template.members.map((member) => ({
        userId: member.userId,
        role: member.role,
        source: "template" as const,
        templateId: template.id
      }));
    } else if (body.teamUserIds?.length) {
      if (!body.teamUserIds.some((teamUser) => teamUser.role === "owner")) {
        throw new Error("Team must have at least one owner.");
      }

      normalizedAssignments = body.teamUserIds.map((teamUser) => ({
        userId: teamUser.userId,
        role: teamUser.role,
        source: "manual" as const
      }));
    } else {
      throw new Error("Select at least one hiring team owner before registering this candidate.");
    }

    for (const teamAssignment of normalizedAssignments) {
      if (!availableTeamUserIds.has(teamAssignment.userId)) {
        throw new Error("Every assigned hiring team member must have an active department access grant.");
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

    const candidate = await createCandidate({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      roleId: body.roleId,
      departmentId: body.departmentId,
      positionAppliedFor: body.positionAppliedFor,
      batchId: body.batchId,
      resumeSource: body.resumeSource,
      hrOwnerId: body.hrOwnerId,
      candidateFolderUrl: body.candidateFolderUrl,
      notesSummary: body.notesSummary,
      stage: body.stage,
      nextAction: body.nextAction,
      screeningStatus: body.screeningStatus || undefined,
      teamAssignments: normalizedAssignments,
      createMilestones: false
    });

    if (formRequest) {
      const url = new URL(`/people/candidates/${candidate.id}`, request.url);
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
      const url = new URL("/people/candidates/new", request.url);
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
