import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  base64UrlToString,
  signTokenValue,
  stringToBase64Url
} from "@/lib/auth/token-codec";

export const RUNTIME_SESSION_COOKIE_NAME = "assessment_runtime_session";
const RUNTIME_SESSION_MAX_AGE = 60 * 60 * 12;

export interface RuntimeSession {
  attemptId: string;
  slug: string;
  exp: number;
}

function getRuntimeSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is not configured.");
  }
  return secret;
}

async function signValue(value: string) {
  return signTokenValue(getRuntimeSessionSecret(), value);
}

export async function createRuntimeSessionToken(payload: Omit<RuntimeSession, "exp">) {
  const exp = Math.floor(Date.now() / 1000) + RUNTIME_SESSION_MAX_AGE;
  const encodedPayload = stringToBase64Url(JSON.stringify({ ...payload, exp }));
  const signature = await signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifyRuntimeSessionToken(
  token?: string | null
): Promise<RuntimeSession | null> {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = await signValue(encodedPayload);
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(base64UrlToString(encodedPayload)) as RuntimeSession;
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (!payload.attemptId || !payload.slug) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getRuntimeSession() {
  const cookieStore = await cookies();
  return verifyRuntimeSessionToken(cookieStore.get(RUNTIME_SESSION_COOKIE_NAME)?.value);
}

export function setRuntimeSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(RUNTIME_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: RUNTIME_SESSION_MAX_AGE
  });
}

export function clearRuntimeSessionCookie(response: NextResponse) {
  response.cookies.set(RUNTIME_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export function runtimeSessionMatchesAttempt(
  session: RuntimeSession | null,
  args: { attemptId: string; slug?: string }
) {
  if (!session) return false;
  if (session.attemptId !== args.attemptId) return false;
  if (args.slug && session.slug !== args.slug) return false;
  return true;
}
