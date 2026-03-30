import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

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

function bytesToBase64Url(bytes: Uint8Array) {
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(bytes).toString("base64")
      : btoa(String.fromCharCode(...bytes));

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function stringToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(padded, "base64"));
  }

  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function base64UrlToString(value: string) {
  const bytes = base64UrlToBytes(value);
  return new TextDecoder().decode(bytes);
}

async function importRuntimeKey() {
  const secret = new TextEncoder().encode(getRuntimeSessionSecret());
  return crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify"
  ]);
}

async function signValue(value: string) {
  const key = await importRuntimeKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
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
