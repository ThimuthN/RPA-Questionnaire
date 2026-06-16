import { createHmac, randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";

export type UserTokenPurpose = "invite" | "password_reset";

const TTL_HOURS: Record<UserTokenPurpose, number> = {
  invite: 72,
  password_reset: 1
};

// Keyed with the server secret so a database-only attacker can't forge a valid
// token hash. Only the hash is stored; the raw token lives in the emailed link.
function tokenKey(): string {
  return `${process.env.AUTH_SESSION_SECRET ?? "northstar-token-fallback"}:user-auth-token`;
}

function hashToken(raw: string): string {
  return createHmac("sha256", tokenKey()).update(raw.trim()).digest("hex");
}

export async function issueUserAuthToken(input: {
  userId: string;
  purpose: UserTokenPurpose;
  createdById?: string | null;
}): Promise<{ rawToken: string; expiresAt: Date }> {
  // Invalidate any outstanding unused tokens of the same purpose first.
  await prisma.userAuthToken.deleteMany({
    where: { userId: input.userId, purpose: input.purpose, usedAt: null }
  });

  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_HOURS[input.purpose] * 60 * 60 * 1000);

  await prisma.userAuthToken.create({
    data: {
      userId: input.userId,
      purpose: input.purpose,
      tokenHash: hashToken(rawToken),
      expiresAt,
      createdById: input.createdById ?? null
    }
  });

  return { rawToken, expiresAt };
}

type TokenResult = { ok: true; userId: string } | { ok: false; reason: string };

async function lookupValid(rawToken: string, purpose: UserTokenPurpose) {
  const record = await prisma.userAuthToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    select: { id: true, userId: true, purpose: true, expiresAt: true, usedAt: true }
  });
  if (!record || record.purpose !== purpose) return { record: null, reason: "This link is invalid." };
  if (record.usedAt) return { record: null, reason: "This link has already been used." };
  if (record.expiresAt.getTime() <= Date.now()) return { record: null, reason: "This link has expired." };
  return { record, reason: null };
}

/** Non-destructive check used when rendering the page (before showing the form). */
export async function peekUserAuthToken(rawToken: string, purpose: UserTokenPurpose): Promise<TokenResult> {
  const { record, reason } = await lookupValid(rawToken, purpose);
  return record ? { ok: true, userId: record.userId } : { ok: false, reason: reason! };
}

/** Single-use consume on submit; atomically marks the token used. */
export async function consumeUserAuthToken(rawToken: string, purpose: UserTokenPurpose): Promise<TokenResult> {
  const { record, reason } = await lookupValid(rawToken, purpose);
  if (!record) return { ok: false, reason: reason! };

  const updated = await prisma.userAuthToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() }
  });
  if (updated.count === 0) return { ok: false, reason: "This link has already been used." };

  return { ok: true, userId: record.userId };
}
