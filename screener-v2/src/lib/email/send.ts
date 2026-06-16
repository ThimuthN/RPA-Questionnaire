import { getResendClient, getFromAddress } from "./client";
import { prisma } from "@/lib/db/prisma";
import { decryptIntegrationSecret, encryptIntegrationSecret } from "@/lib/integrations/crypto";
import { refreshMicrosoftToken } from "@/lib/integrations/providers/microsoft";
import { sendViaMailbox } from "@/lib/integrations/graph";

export type EmailTemplate =
  | "application_received"
  | "interview_invite"
  | "stage_advance"
  | "rejection"
  | "offer_sent"
  | "screener_invite"
  | "ad_hoc"
  | "user_invite"
  | "password_reset";

export interface SendEmailInput {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  template: EmailTemplate;
  candidateId?: string;
  sentById?: string;
  departmentId?: string;
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

async function tryMicrosoftMailbox(input: SendEmailInput): Promise<SendEmailResult | null> {
  if (!input.departmentId) return null;

  const connection = await prisma.departmentIntegrationConnection.findUnique({
    where: { departmentId_provider: { departmentId: input.departmentId, provider: "microsoft" } },
    include: {
      resources: { where: { resourceType: "send_mailbox", isDefault: true }, take: 1 },
    },
  }).catch(() => null);

  if (!connection || connection.status !== "connected") return null;
  if (!connection.resources[0] || !connection.accessTokenEncrypted) return null;

  const providerRow = await prisma.integrationProviderApp.findUnique({ where: { provider: "microsoft" } });
  if (!providerRow?.clientId || !providerRow.clientSecretEncrypted) return null;

  let accessToken = decryptIntegrationSecret(connection.accessTokenEncrypted);
  const expiresAt = connection.tokenExpiresAt?.getTime() ?? 0;

  if (!accessToken || (expiresAt && expiresAt < Date.now() + 60_000)) {
    if (!connection.refreshTokenEncrypted) return null;
    try {
      const config = {
        provider: "microsoft" as const,
        clientId: providerRow.clientId,
        clientSecret: decryptIntegrationSecret(providerRow.clientSecretEncrypted),
        tenantId: providerRow.tenantId ?? undefined,
        enabled: true,
        scopes: [],
      };
      const refreshed = await refreshMicrosoftToken({
        config,
        refreshToken: decryptIntegrationSecret(connection.refreshTokenEncrypted),
      });
      await prisma.departmentIntegrationConnection.update({
        where: { id: connection.id },
        data: {
          accessTokenEncrypted: encryptIntegrationSecret(refreshed.accessToken),
          refreshTokenEncrypted: refreshed.refreshToken
            ? encryptIntegrationSecret(refreshed.refreshToken)
            : connection.refreshTokenEncrypted,
          tokenExpiresAt: refreshed.expiresAt ?? null,
        },
      });
      accessToken = refreshed.accessToken;
    } catch {
      return null;
    }
  }

  try {
    const toList = normalizeAddresses(input.to);
    const ccList = normalizeAddresses(input.cc);
    await sendViaMailbox(accessToken, {
      to: toList,
      cc: ccList.length > 0 ? ccList : undefined,
      subject: input.subject,
      html: input.html,
    });
    await logEmail(input, "sent");
    return { ok: true };
  } catch (err) {
    // Fall through to Resend
    const error = err instanceof Error ? err.message : "Microsoft mailbox send failed";
    console.warn("[email] Microsoft mailbox failed, falling back to Resend:", error);
    return null;
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  // Prefer connected Microsoft mailbox if departmentId is provided
  const msResult = await tryMicrosoftMailbox(input);
  if (msResult) return msResult;

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
