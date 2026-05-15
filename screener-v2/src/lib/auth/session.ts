import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  base64UrlToString,
  signTokenValue,
  stringToBase64Url
} from "@/lib/auth/token-codec";

export const SESSION_COOKIE_NAME = "assessment_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type AppAccessLevel = "admin" | "recruiter" | "hiring_manager" | "interviewer" | "member";

export interface AppSession {
  userId: string | null;
  email: string;
  name?: string | null;
  accessLevel: AppAccessLevel;
  exp: number;
}

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is not configured.");
  }
  return secret;
}

async function signValue(value: string) {
  return signTokenValue(getSessionSecret(), value);
}

export async function createSessionToken(payload: Omit<AppSession, "exp">) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const encodedPayload = stringToBase64Url(JSON.stringify({ ...payload, exp }));
  const signature = await signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token?: string | null): Promise<AppSession | null> {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = await signValue(encodedPayload);
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(base64UrlToString(encodedPayload)) as AppSession;
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    const validAccessLevels: AppAccessLevel[] = ["admin", "recruiter", "hiring_manager", "interviewer", "member"];
    if (!validAccessLevels.includes(payload.accessLevel)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export function sanitizeNextPath(raw?: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/create-test";
  }
  return raw;
}
