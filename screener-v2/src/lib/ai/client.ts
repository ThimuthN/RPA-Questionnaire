import { getStarryRuntime } from "./config";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type StarryChatResult =
  | { ok: true; text: string }
  | { ok: false; error: string; code: "not_configured" | "provider_error" | "exception" };

/**
 * Provider-agnostic chat call. Supports Anthropic (Claude) and any OpenAI-compatible
 * endpoint (OpenAI, or a local model via a custom base URL) — dependency-free via fetch.
 */
export async function runStarryChat(input: {
  messages: ChatMessage[];
  system: string;
  maxTokens?: number;
}): Promise<StarryChatResult> {
  const rt = await getStarryRuntime();
  if (!rt) {
    return { ok: false, code: "not_configured", error: "Starry isn’t set up yet — an admin can connect an AI provider in Integrations." };
  }

  const maxTokens = input.maxTokens ?? 1024;

  try {
    if (rt.providerKind === "anthropic") {
      const base = (rt.baseUrl || "https://api.anthropic.com").replace(/\/$/, "");
      if (!base.startsWith("https://")) {
        return { ok: false, code: "provider_error", error: "AI provider base URL must use HTTPS." };
      }
      const res = await fetch(`${base}/v1/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": rt.apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: rt.model,
          max_tokens: maxTokens,
          system: input.system,
          messages: input.messages
        })
      });
      if (!res.ok) {
        return { ok: false, code: "provider_error", error: `AI provider returned ${res.status}.` };
      }
      const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
      const text = (data.content ?? [])
        .filter((b) => b.type === "text" && typeof b.text === "string")
        .map((b) => b.text as string)
        .join("\n")
        .trim();
      return { ok: true, text: text || "(no response)" };
    }

    // OpenAI-compatible (OpenAI / local model with a custom base URL)
    const base = (rt.baseUrl || "https://api.openai.com").replace(/\/$/, "");
    if (!base.startsWith("https://")) {
      return { ok: false, code: "provider_error", error: "AI provider base URL must use HTTPS." };
    }
    const res = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${rt.apiKey}`
      },
      body: JSON.stringify({
        model: rt.model,
        max_tokens: maxTokens,
        messages: [{ role: "system", content: input.system }, ...input.messages]
      })
    });
    if (!res.ok) {
      return { ok: false, code: "provider_error", error: `AI provider returned ${res.status}.` };
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    return { ok: true, text: text || "(no response)" };
  } catch (error) {
    return { ok: false, code: "exception", error: error instanceof Error ? error.message : "AI request failed." };
  }
}
