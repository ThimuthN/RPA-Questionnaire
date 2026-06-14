import { cookies } from "next/headers";
import { base64UrlToString, signTokenValue, stringToBase64Url } from "@/lib/auth/token-codec";
import type { IntegrationProvider } from "@/lib/integrations/types";

const OAUTH_STATE_COOKIE = "integration_oauth_state";

type IntegrationOauthStatePayload = {
  provider: IntegrationProvider;
  departmentId: string;
  exp: number;
};

function getSigningSecret() {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is required for integration OAuth.");
  }
  return secret;
}

function encodePayload(payload: IntegrationOauthStatePayload) {
  return stringToBase64Url(JSON.stringify(payload));
}

async function buildSignedState(payload: IntegrationOauthStatePayload) {
  const encodedPayload = encodePayload(payload);
  const signature = await signTokenValue(getSigningSecret(), encodedPayload);
  return `${encodedPayload}.${signature}`;
}

async function resolveIntegrationOauthState(expectedToken: string, consume: boolean) {
  const cookieStore = await cookies();
  const stored = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  if (consume) {
    cookieStore.delete(OAUTH_STATE_COOKIE);
  }

  if (!stored || stored !== expectedToken) {
    throw new Error("Integration authorization state did not match.");
  }

  const [encodedPayload, signature] = stored.split(".");
  if (!encodedPayload || !signature) {
    throw new Error("Integration authorization state is invalid.");
  }

  const expectedSignature = await signTokenValue(getSigningSecret(), encodedPayload);
  if (expectedSignature !== signature) {
    throw new Error("Integration authorization signature is invalid.");
  }

  const payload = JSON.parse(base64UrlToString(encodedPayload)) as IntegrationOauthStatePayload;
  if (!payload.exp || payload.exp < Date.now()) {
    throw new Error("Integration authorization state expired.");
  }

  return payload;
}

export async function createIntegrationOauthState(provider: IntegrationProvider, departmentId: string) {
  const token = await buildSignedState({
    provider,
    departmentId,
    exp: Date.now() + 10 * 60_000
  });

  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60
  });

  return token;
}

export async function peekIntegrationOauthState(expectedToken: string) {
  return resolveIntegrationOauthState(expectedToken, false);
}

export async function consumeIntegrationOauthState(expectedToken: string) {
  return resolveIntegrationOauthState(expectedToken, true);
}
