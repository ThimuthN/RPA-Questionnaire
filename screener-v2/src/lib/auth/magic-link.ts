import type { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  base64UrlToString,
  signTokenValue,
  stringToBase64Url
} from "@/lib/auth/token-codec";
import { prisma } from "@/lib/db/prisma";
import { hashValue, randomToken } from "@/lib/tokens/token-service";

const TTL_MINUTES = 20;
export const MAGIC_VERIFICATION_COOKIE_NAME = "assessment_magic_verified";
const MAGIC_VERIFICATION_MAX_AGE = 60 * 5;

interface MagicVerificationSession {
  email: string;
  exp: number;
}

function getMagicVerificationSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is not configured.");
  }
  return secret;
}

async function signValue(value: string) {
  return signTokenValue(getMagicVerificationSecret(), value);
}

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

export async function createMagicVerificationToken(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const exp = Math.floor(Date.now() / 1000) + MAGIC_VERIFICATION_MAX_AGE;
  const encodedPayload = stringToBase64Url(JSON.stringify({ email: normalizedEmail, exp }));
  const signature = await signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifyMagicVerificationToken(
  token?: string | null
): Promise<MagicVerificationSession | null> {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = await signValue(encodedPayload);
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(base64UrlToString(encodedPayload)) as MagicVerificationSession;
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (!payload.email) {
      return null;
    }
    return {
      email: payload.email.trim().toLowerCase(),
      exp: payload.exp
    };
  } catch {
    return null;
  }
}

export async function getMagicVerificationSession() {
  const cookieStore = await cookies();
  return verifyMagicVerificationToken(cookieStore.get(MAGIC_VERIFICATION_COOKIE_NAME)?.value);
}

export function setMagicVerificationCookie(response: NextResponse, token: string) {
  response.cookies.set(MAGIC_VERIFICATION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAGIC_VERIFICATION_MAX_AGE
  });
}

export function clearMagicVerificationCookie(response: NextResponse) {
  response.cookies.set(MAGIC_VERIFICATION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
