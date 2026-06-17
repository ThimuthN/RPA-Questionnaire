import { NextResponse } from "next/server";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { logAudit } from "@/lib/auth/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    select: { departmentId: true, fullName: true },
  });
  if (!candidate) return NextResponse.json({ ok: false, message: "Candidate not found" }, { status: 404 });

  const perm = await requirePermissionForDepartment(auth.session, "delete_candidate", candidate.departmentId);
  if (!perm.ok) return perm.response;

  const [profile, applications, assessments, notes, externalAssessments, offers, emailLogs, milestones, activityEvents] = await Promise.all([
    prisma.candidate.findUnique({
      where: { id },
      select: {
        id: true, fullName: true, email: true, phone: true,
        location: true, currentTitle: true, linkedInUrl: true,
        salaryExpectation: true,
        resumeSource: true, stage: true, orgStatus: true, orgStage: true,
        finalizedAs: true, batchId: true, createdAt: true, updatedAt: true,
      },
    }),
    prisma.candidateApplication.findMany({
      where: { candidateId: id },
      select: {
        id: true, status: true, source: true, referredBy: true,
        consentGivenAt: true, consentVersion: true, coverNote: true,
        createdAt: true, updatedAt: true,
        jobPosting: { select: { id: true, title: true } },
      },
    }),
    prisma.candidateAssessment.findMany({
      where: { candidateId: id },
      select: {
        id: true, inviteId: true, createdAt: true,
        attempt: {
          select: { id: true, status: true, startedAt: true, submittedAt: true },
        },
      },
    }),
    prisma.candidateNote.findMany({
      where: { candidateId: id, deletedAt: null },
      select: { id: true, type: true, body: true, createdAt: true },
    }),
    prisma.candidateExternalAssessment.findMany({
      where: { candidateId: id },
      select: {
        id: true, title: true, sourceLabel: true, status: true,
        scorePercent: true, scoreLabel: true, summary: true, completedAt: true, createdAt: true,
      },
    }),
    prisma.candidateOffer.findUnique({
      where: { candidateId: id },
      select: {
        id: true, status: true, compensationType: true,
        compensationAmount: true, currency: true,
        targetStartDate: true, expiresAt: true, sentAt: true,
        respondedAt: true, createdAt: true,
      },
    }),
    prisma.emailLog.findMany({
      where: { candidateId: id },
      select: { id: true, to: true, cc: true, subject: true, template: true, status: true, sentAt: true },
    }),
    prisma.candidateMilestone.findMany({
      where: { candidateId: id },
      select: { id: true, type: true, title: true, status: true, date: true, result: true, notes: true, createdAt: true },
    }),
    prisma.candidateActivityEvent.findMany({
      where: { candidateId: id },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { id: true, event: true, entityType: true, detail: true, createdAt: true },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    exportedBy: auth.session.email,
    candidate: profile,
    applications,
    assessments,
    externalAssessments,
    notes,
    milestones,
    emailLogs,
    offer: offers,
    activityEvents,
  };

  await logAudit({
    action: "candidate_data_exported",
    actorId: auth.session.userId,
    actorEmail: auth.session.email,
    targetId: id,
    targetType: "candidate",
    ipAddress: _request.headers.get("x-forwarded-for") ?? _request.headers.get("x-real-ip"),
    userAgent: _request.headers.get("user-agent"),
  });

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="candidate-${id}-export.json"`,
    },
  });
}
