import { z } from "zod";
import { integrationProviders, integrationResourceTypes, type IntegrationProvider } from "@/lib/integrations/types";

const providerSchema = z.enum(integrationProviders);

export function parseIntegrationProvider(value: string): IntegrationProvider {
  return providerSchema.parse(value);
}

export const providerAppBodySchema = z.object({
  provider: providerSchema,
  clientId: z.string().trim().optional().default(""),
  clientSecret: z.string().optional().default(""),
  tenantId: z.string().optional().default(""),
  enabled: z.boolean().default(false),
  scopes: z.array(z.string()).optional().default([])
});

export const rotateSecretSchema = z.object({
  clientSecret: z.string().min(1, "Client secret is required.")
});

export const setDefaultsSchema = z.object({
  send_mailbox: z.string().optional(),
  reply_mailbox: z.string().optional(),
  calendar: z.string().optional(),
  meeting_host: z.string().optional()
});

export const callbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  error: z.string().optional(),
  error_description: z.string().optional()
});

export const integrationResourceTypeSchema = z.enum(integrationResourceTypes);
