function normalizeAppUrl(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : null;
}

export function getConfiguredAppUrl() {
  const configured = normalizeAppUrl(process.env.APP_URL);
  if (configured) {
    return configured;
  }

  const publicUrl = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (publicUrl) {
    return publicUrl;
  }

  // Vercel sets VERCEL_URL automatically in all deployment environments.
  const vercelUrl = normalizeAppUrl(process.env.VERCEL_URL);
  if (vercelUrl) {
    return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
  }

  return null;
}

export function getAppUrl(request: Request) {
  return getConfiguredAppUrl() ?? new URL(request.url).origin;
}
