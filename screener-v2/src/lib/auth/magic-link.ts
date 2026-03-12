import { prisma } from "@/lib/db/prisma";
import { hashValue, randomToken } from "@/lib/tokens/token-service";

const TTL_MINUTES = 20;

export async function issueMagicToken(email: string) {
  const token = randomToken(18);
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);
  await prisma.magicToken.create({
    data: {
      tokenHash: hashValue(token),
      email: email.toLowerCase(),
      expiresAt
    }
  });
  return token;
}

export async function verifyMagicToken(token: string): Promise<{ ok: boolean; email?: string; message?: string }> {
  const tokenHash = hashValue(token);
  const row = await prisma.magicToken.findUnique({
    where: { tokenHash }
  });
  if (!row) return { ok: false, message: "Invalid token." };
  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.magicToken.delete({ where: { tokenHash } });
    return { ok: false, message: "Token expired." };
  }

  await prisma.magicToken.delete({ where: { tokenHash } });
  return { ok: true, email: row.email };
}
