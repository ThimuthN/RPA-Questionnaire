type JsonResponsePayload = {
  message?: string;
  requestId?: string;
};

const DEFAULT_REQUEST_TIMEOUT_MS = 20_000;

function timeoutMessage() {
  return "Request timed out. Please try again.";
}

export async function fetchJsonWithTimeout<T>(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<{ response: Response; data: T | null }> {
  const { timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, ...requestInit } = init;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...requestInit,
      signal: controller.signal
    });
    const data = (await response.json().catch(() => null)) as T | null;
    return { response, data };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(timeoutMessage());
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function asJsonResponsePayload(value: unknown): JsonResponsePayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const payload = value as Record<string, unknown>;
  return {
    message: typeof payload.message === "string" ? payload.message : undefined,
    requestId: typeof payload.requestId === "string" ? payload.requestId : undefined
  };
}

export function buildRequestErrorMessage(payload: unknown, fallback: string) {
  const normalized = asJsonResponsePayload(payload);
  const detail = normalized?.requestId ? ` (Request ID: ${normalized.requestId})` : "";
  return `${normalized?.message || fallback}${detail}`;
}
