export async function readJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  const text = await response.text().catch(() => "");
  throw new Error(`${fallbackMessage}${text ? ` (${text.slice(0, 240)})` : ""}`);
}

export function normalizeScopes(scopes: string[] | undefined, defaults: string[]) {
  const values = (scopes ?? defaults).map((value) => value.trim()).filter(Boolean);
  return Array.from(new Set(values));
}

export function toFormBody(values: Record<string, string>) {
  const body = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => body.set(key, value));
  return body;
}
