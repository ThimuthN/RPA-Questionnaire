function parseBooleanFlag(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

export const PUBLIC_JOBS_ENABLED = parseBooleanFlag(process.env.PUBLIC_JOBS_ENABLED, true);
