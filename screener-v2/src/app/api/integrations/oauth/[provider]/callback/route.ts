import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { callbackQuerySchema, parseIntegrationProvider } from "@/lib/integrations/http";
import { peekIntegrationOauthState } from "@/lib/integrations/oauth-state";
import { completeDepartmentProviderConnection } from "@/lib/integrations/service";

function callbackTarget(departmentId: string, query: Record<string, string>) {
  const params = new URLSearchParams(query);
  return `/departments/${departmentId}/access${params.toString() ? `?${params.toString()}` : ""}` as Route;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerRaw } = await params;
  const rawQuery = Object.fromEntries(new URL(request.url).searchParams.entries());

  try {
    const provider = parseIntegrationProvider(providerRaw);
    const parsed = callbackQuerySchema.parse(rawQuery);

    if (parsed.error) {
      const state = await peekIntegrationOauthState(parsed.state);
      const detail = parsed.error_description ? `${parsed.error}: ${parsed.error_description}` : parsed.error;
      redirect(callbackTarget(state.departmentId, { error: detail }));
    }

    const result = await completeDepartmentProviderConnection({
      provider,
      state: parsed.state,
      code: parsed.code
    });

    redirect(callbackTarget(result.departmentId, { integrationUpdated: provider }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect("/departments?error=Invalid%20provider%20callback%20payload.");
    }

    if (typeof rawQuery.state === "string") {
      try {
        const state = await peekIntegrationOauthState(rawQuery.state);
        const message = error instanceof Error ? error.message : "Could not finish provider connection.";
        redirect(callbackTarget(state.departmentId, { error: message }));
      } catch {
        // Fall back to the global admin route below.
      }
    }

    const message = error instanceof Error ? error.message : "Could not finish provider connection.";
    redirect(`/departments?error=${encodeURIComponent(message)}`);
  }
}
