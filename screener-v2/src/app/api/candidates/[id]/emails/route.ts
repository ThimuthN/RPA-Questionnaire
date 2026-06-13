import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { prisma } from "@/lib/db/prisma";
import {
  sendEmail,
  getOrgName,
  adHocEmail,
  applicationReceivedEmail,
  interviewInviteEmail,
  stageAdvanceEmail,
  rejectionEmail,
  offerSentEmail,
  screenerInviteEmail,
} from "@/lib/email";
import type { EmailTemplate } from "@/lib/email";

const sendEmailSchema = z.object({
  template: z.enum([
    "ad_hoc",
    "application_received",
    "interview_invite",
    "stage_advance",
    "rejection",
    "offer_sent",
    "screener_invite",
  ]),
  to: z.string().email(),
  ccEmails: z.array(z.string().email()).optional().default([]),
  subject: z.string().min(1).max(200),
  bodyOverride: z.string().optional(),
  // template-specific params passed as flat object
  params: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const perm = await requireCandidatePermission(auth.session, id, "view_candidates");
  if (!perm.ok) return perm.response;

  const logs = await prisma.emailLog.findMany({
    where: { candidateId: id },
    orderBy: { sentAt: "desc" },
    take: 50,
    select: {
      id: true,
      to: true,
      cc: true,
      subject: true,
      template: true,
      status: true,
      errorMsg: true,
      sentAt: true,
      sentBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    logs: logs.map((l) => ({
      ...l,
      sentAt: l.sentAt.toISOString(),
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const perm = await requireCandidatePermission(auth.session, id, "manage_candidates");
  if (!perm.ok) return perm.response;

  try {
    const body = sendEmailSchema.parse(await request.json());

    // Fetch candidate + hiring team
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        departmentCandidacies: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            teamAssignments: {
              where: { isActive: true },
              select: {
                user: { select: { email: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ ok: false, message: "Candidate not found" }, { status: 404 });
    }

    const orgName = getOrgName();
    const ccEmails: string[] = [...(body.ccEmails ?? [])];

    // Auto-add active hiring team members as CC (excluding the primary recipient)
    const teamEmails = candidate.departmentCandidacies[0]?.teamAssignments.map((a) => a.user.email) ?? [];
    for (const email of teamEmails) {
      if (email !== body.to && !ccEmails.includes(email)) {
        ccEmails.push(email);
      }
    }

    const p = body.params as Record<string, string>;
    let subject = body.subject;
    let html = "";

    switch (body.template as EmailTemplate) {
      case "ad_hoc": {
        const rendered = adHocEmail({
          orgName,
          candidateName: candidate.fullName,
          subject,
          bodyHtml: body.bodyOverride ?? p.bodyHtml ?? "",
          senderName: auth.session.name ?? undefined,
          senderEmail: auth.session.email ?? undefined,
        });
        html = rendered.html;
        break;
      }

      case "application_received": {
        const rendered = applicationReceivedEmail({
          orgName,
          candidateName: candidate.fullName,
          roleTitle: p.roleTitle ?? "the position",
          departmentName: p.departmentName,
          applicationDate: p.applicationDate ?? new Date().toLocaleDateString(),
        });
        subject = rendered.subject;
        html = rendered.html;
        break;
      }

      case "interview_invite": {
        const rendered = interviewInviteEmail({
          orgName,
          candidateName: candidate.fullName,
          roleTitle: p.roleTitle ?? "the position",
          roundName: p.roundName ?? "Interview",
          scheduledAt: new Date(p.scheduledAt ?? Date.now()),
          durationMin: Number(p.durationMin ?? 60),
          format: p.format ?? "video",
          interviewerNames: p.interviewerNames ? JSON.parse(p.interviewerNames) : [],
          meetingLink: p.meetingLink,
          locationNote: p.locationNote,
          additionalNotes: body.bodyOverride ?? p.additionalNotes,
        });
        subject = body.subject || rendered.subject;
        html = rendered.html;
        break;
      }

      case "stage_advance": {
        const rendered = stageAdvanceEmail({
          orgName,
          candidateName: candidate.fullName,
          roleTitle: p.roleTitle ?? "the position",
          fromStage: p.fromStage ?? "",
          toStage: p.toStage ?? "",
          recruiterName: auth.session.name ?? undefined,
          recruiterEmail: auth.session.email ?? undefined,
          additionalMessage: body.bodyOverride ?? p.additionalMessage,
        });
        subject = body.subject || rendered.subject;
        html = rendered.html;
        break;
      }

      case "rejection": {
        const rendered = rejectionEmail({
          orgName,
          candidateName: candidate.fullName,
          roleTitle: p.roleTitle ?? "the position",
          personalNote: body.bodyOverride ?? p.personalNote,
          recruiterName: auth.session.name ?? undefined,
        });
        subject = body.subject || rendered.subject;
        html = rendered.html;
        break;
      }

      case "offer_sent": {
        const rendered = offerSentEmail({
          orgName,
          candidateName: candidate.fullName,
          roleTitle: p.roleTitle ?? "the position",
          compensationFormatted: p.compensationFormatted ?? "To be confirmed",
          targetStartDate: p.targetStartDate,
          expiresAt: p.expiresAt,
          offerNotes: body.bodyOverride ?? p.offerNotes,
          recruiterName: auth.session.name ?? undefined,
          recruiterEmail: auth.session.email ?? undefined,
        });
        subject = body.subject || rendered.subject;
        html = rendered.html;
        break;
      }

      case "screener_invite": {
        const rendered = screenerInviteEmail({
          orgName,
          candidateName: candidate.fullName,
          roleTitle: p.roleTitle ?? "the position",
          inviteUrl: p.inviteUrl ?? "",
          expiresAt: new Date(p.expiresAt ?? Date.now() + 7 * 24 * 60 * 60 * 1000),
          estimatedMinutes: p.estimatedMinutes ? Number(p.estimatedMinutes) : undefined,
        });
        subject = body.subject || rendered.subject;
        html = rendered.html;
        break;
      }

      default:
        return NextResponse.json({ ok: false, message: "Unknown template" }, { status: 400 });
    }

    const result = await sendEmail({
      to: body.to,
      cc: ccEmails,
      subject,
      html,
      template: body.template as EmailTemplate,
      candidateId: id,
      sentById: auth.session.userId ?? undefined,
    });

    return NextResponse.json({ ok: result.ok, messageId: result.messageId, error: result.error });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
