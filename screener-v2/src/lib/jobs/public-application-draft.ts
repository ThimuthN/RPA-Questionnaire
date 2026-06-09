export const DRAFT_VERSION = 1 as const;
const PREFIX = "northstar:job-application-draft:";

export type ApplicationDraft = {
  version: typeof DRAFT_VERSION;
  fullName: string;
  email: string;
  phone: string;
  coverNote: string;
  step: number;
};

function getStorage(): Storage | null {
  try {
    const g = globalThis as { localStorage?: Storage };
    return g.localStorage ?? null;
  } catch {
    return null;
  }
}

export function draftKey(slug: string): string {
  return `${PREFIX}${slug}`;
}

export function loadApplicationDraft(key: string): ApplicationDraft | null {
  try {
    const raw = getStorage()?.getItem(key) ?? null;
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as { version?: unknown }).version !== DRAFT_VERSION
    ) {
      return null;
    }
    return parsed as ApplicationDraft;
  } catch {
    return null;
  }
}

export function saveApplicationDraft(
  key: string,
  draft: Omit<ApplicationDraft, "version">
): void {
  try {
    getStorage()?.setItem(key, JSON.stringify({ ...draft, version: DRAFT_VERSION }));
  } catch {
    // localStorage may be unavailable (private mode, quota exceeded) — fail silently
  }
}

export function clearApplicationDraft(key: string): void {
  try {
    getStorage()?.removeItem(key);
  } catch {
    // ignore
  }
}
