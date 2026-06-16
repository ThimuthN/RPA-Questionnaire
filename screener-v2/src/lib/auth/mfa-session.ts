import type { NextResponse } from "next/server";
import {
  base64UrlToString,
  signTokenValue,
  stringToBase64Url
} from "@/lib/auth/token-codec";

export const MFA_CHALLENGE_COOKIE = "mfa_challenge";
export const MFA_DEVICE_COOKIE = "mfa_device";
const CHALLENGE_TTL = 60 * 10; // 10 minutes
const DEVICE_TTL = 60 * 60 * 24 * 30; // 30 days

function secret() {
  const s = process.env.AUTH_SESSION_SECRET;
  if (!s) throw new Error("AUTH_SESSION_SECRET is not configured.");
  return s;
}

export type MfaChallengePayload = {
  userId: string;
  email: string;
  nextPath: string;
  exp: number;
  t: "mfa";
};

export async function createMfaChallengeToken(
  payload: Omit<MfaChallengePayload, "exp" | "t">
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + CHALLENGE_TTL;
  const encoded = stringToBase64Url(JSON.stringify({ ...payload, exp, t: "mfa" }));
  const sig = await signTokenValue(secret(), encoded);
  return `${encoded}.${sig}`;
}

export async function verifyMfaChallengeToken(
  token?: string | null
): Promise<MfaChallengePayload | null> {
  if (!token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const expected = await signTokenValue(secret(), encoded);
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(base64UrlToString(encoded)) as MfaChallengePayload;
    if (payload.t !== "mfa") return null;
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setMfaChallengeCookie(res: NextResponse, token: string) {
  res.cookies.set(MFA_CHALLENGE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CHALLENGE_TTL
  });
}

export function clearMfaChallengeCookie(res: NextResponse) {
  res.cookies.set(MFA_CHALLENGE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export function setMfaDeviceCookie(res: NextResponse, token: string) {
  res.cookies.set(MFA_DEVICE_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEVICE_TTL
  });
}

export function clearMfaDeviceCookie(res: NextResponse) {
  res.cookies.set(MFA_DEVICE_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}
