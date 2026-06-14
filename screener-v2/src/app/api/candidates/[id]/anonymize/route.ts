import { NextResponse } from "next/server";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { createRequestLogContext, logRouteError } from "@/lib/server/logger";
import { prisma } from "@/lib/db/prisma";
import { cuidLike } from "@/lib/tokens/token-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = createRequestLogContext(request, "api.candidates.anonymize");
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: {
        id: true,
        stage: true,
        departmentId: true,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { ok: false, message: "Candidate not found" },
        { status: 404 }
      );
    }

    const scopedPermission = await requirePermissionForDepartment(
      auth.session,
      "delete_candidate",
      candidate.departmentId
    );
    if (!scopedPermission.ok) return scopedPermission.response;

    if (candidate.stage === "finalized") {
      return NextResponse.json(
        { ok: false, message: "Cannot anonymize a finalized candidate" },
        { status: 400 }
      );
    }

    // Anonymize candidate PII
    await prisma.candidate.update({
      where: { id },
      data: {
        fullName: "Redacted",
        email: `redacted-${id}@deleted.local`,
        phone: null,
        positionAppliedFor: null,
        resumeSource: null,
        updatedAt: new Date(),
      },
    });

    // Redact all notes
    await prisma.candidateNote.updateMany({
      where: { candidateId: id },
      data: { body: "[redacted]" },
    });

    // Log activity event
    await prisma.candidateActivityEvent.create({
      data: {
        id: cuidLike(),
        candidateId: id,
        actorId: auth.session.userId,
        actorName: auth.session.name || auth.session.email || "System",
        event: "candidate_profile_updated",
        detail: "Candidate data anonymized",
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logRouteError("candidate_anonymize_failed", context, error);
    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
