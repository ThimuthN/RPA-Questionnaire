import { getResendClient, getFromAddress } from "./client";
import { prisma } from "@/lib/db/prisma";

export type EmailTemplate =
  | "application_received"
  | "interview_invite"
  | "stage_advance"
  | "rejection"
  | "offer_sent"
  | "screener_invite"
  | "ad_hoc";

export interface SendEmailInput {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  template: EmailTemplate;
  candidateId?: string;
  sentById?: string;
  attachments?: Array<{ filename: string; content: string; contentType: string }>;
}

export interface SendEmailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

function normalizeAddresses(addr: string | string[] | undefined): string[] {
  if (!addr) return [];
  return Array.isArray(addr) ? addr.filter(Boolean) : [addr].filter(Boolean);
}

async function logEmail(input: SendEmailInput, status: "sent" | "failed", errorMsg?: string) {
  const to = normalizeAddresses(input.to).join(", ");
  const cc = normalizeAddresses(input.cc).join(", ") || undefined;
  try {
    await prisma.emailLog.create({
      data: {
        to,
        cc,
        subject: input.subject,
        template: input.template,
        candidateId: input.candidateId ?? null,
        sentById: input.sentById ?? null,
        status,
        errorMsg: errorMsg ?? null,
      },
    });
  } catch {
    // log failure must never throw
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set — email not sent");
    await logEmail(input, "failed", "RESEND_API_KEY not configured");
    return { ok: false, error: "Email provider not configured" };
  }

  const toList = normalizeAddresses(input.to);
  const ccList = normalizeAddresses(input.cc);

  try {
    const payload: Parameters<typeof client.emails.send>[0] = {
      from: getFromAddress(),
      to: toList,
      subject: input.subject,
      html: input.html,
      ...(ccList.length > 0 ? { cc: ccList } : {}),
      ...(input.attachments?.length
        ? {
            attachments: input.attachments.map((a) => ({
              filename: a.filename,
              content: Buffer.from(a.content).toString("base64"),
              content_type: a.contentType,
            })),
          }
        : {}),
    };

    const result = await client.emails.send(payload);
    await logEmail(input, "sent");
    return { ok: true, messageId: result.data?.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown send error";
    await logEmail(input, "failed", error);
    return { ok: false, error };
  }
}

export async function sendEmailSafe(input: SendEmailInput): Promise<void> {
  try {
    await sendEmail(input);
  } catch {
    // fire-and-forget — never throws
  }
}
