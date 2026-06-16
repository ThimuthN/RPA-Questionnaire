import { prisma } from "@/lib/db/prisma";
import {
  decryptIntegrationSecret,
  encryptIntegrationSecret,
  hasIntegrationEncryptionKey
} from "@/lib/integrations/crypto";

// Starry (the AI assistant) reuses the encrypted provider-app storage so the model
// API key is held the same secure way as every other integration secret.
const PROVIDER = "starry-ai";

export type StarryProviderKind = "anthropic" | "openai";

export const STARRY_DEFAULT_MODEL: Record<StarryProviderKind, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4o-mini"
};

type StarryConfigJson = { providerKind: StarryProviderKind; model: string; baseUrl?: string };

function normalizeKind(value: unknown): StarryProviderKind {
  return value === "openai" ? "openai" : "anthropic";
}

function readConfig(configJson: unknown): StarryConfigJson {
  const cfg = (configJson ?? {}) as Partial<StarryConfigJson>;
  const providerKind = normalizeKind(cfg.providerKind);
  return {
    providerKind,
    model: typeof cfg.model === "string" && cfg.model.trim() ? cfg.model : STARRY_DEFAULT_MODEL[providerKind],
    baseUrl: typeof cfg.baseUrl === "string" && cfg.baseUrl.trim() ? cfg.baseUrl : undefined
  };
}

export type StarryStatus = {
  enabled: boolean;
  hasKey: boolean;
  providerKind: StarryProviderKind;
  model: string;
  baseUrl: string;
  encryptionReady: boolean;
};

/** Non-secret status for admin UI and the dock's availability check. */
export async function getStarryStatus(): Promise<StarryStatus> {
  const row = await prisma.integrationProviderApp.findUnique({ where: { provider: PROVIDER } });
  const cfg = readConfig(row?.configJson);
  return {
    enabled: Boolean(row?.enabled && row?.clientSecretEncrypted),
    hasKey: Boolean(row?.clientSecretEncrypted),
    providerKind: cfg.providerKind,
    model: cfg.model,
    baseUrl: cfg.baseUrl ?? "",
    encryptionReady: hasIntegrationEncryptionKey()
  };
}

export type StarryRuntime = {
  providerKind: StarryProviderKind;
  model: string;
  baseUrl: string;
  apiKey: string;
};

/** Decrypted runtime config for server-side model calls, or null when unavailable. */
export async function getStarryRuntime(): Promise<StarryRuntime | null> {
  if (!hasIntegrationEncryptionKey()) return null;
  const row = await prisma.integrationProviderApp.findUnique({ where: { provider: PROVIDER } });
  if (!row || !row.enabled || !row.clientSecretEncrypted) return null;
  let apiKey: string;
  try {
    apiKey = decryptIntegrationSecret(row.clientSecretEncrypted);
  } catch {
    return null;
  }
  if (!apiKey) return null;
  const cfg = readConfig(row.configJson);
  return { providerKind: cfg.providerKind, model: cfg.model, baseUrl: cfg.baseUrl ?? "", apiKey };
}

export async function saveStarryConfig(input: {
  providerKind: StarryProviderKind;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  enabled: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasIntegrationEncryptionKey()) {
    return { ok: false, error: "INTEGRATIONS_ENCRYPTION_KEY is not configured — cannot store the API key securely." };
  }

  const existing = await prisma.integrationProviderApp.findUnique({ where: { provider: PROVIDER } });
  const willHaveKey = Boolean(input.apiKey?.trim()) || Boolean(existing?.clientSecretEncrypted);
  if (input.enabled && !willHaveKey) {
    return { ok: false, error: "Add an API key before enabling Starry." };
  }

  const configJson: StarryConfigJson = {
    providerKind: input.providerKind,
    model: input.model?.trim() || STARRY_DEFAULT_MODEL[input.providerKind],
    baseUrl: input.baseUrl?.trim() || undefined
  };

  const base = {
    enabled: input.enabled,
    configJson,
    lastHealthStatus: input.enabled ? "configured" : "not_configured",
    ...(input.apiKey?.trim() ? { clientSecretEncrypted: encryptIntegrationSecret(input.apiKey.trim()) } : {})
  };

  if (existing) {
    await prisma.integrationProviderApp.update({ where: { provider: PROVIDER }, data: base });
  } else {
    await prisma.integrationProviderApp.create({ data: { provider: PROVIDER, ...base } });
  }
  return { ok: true };
}
