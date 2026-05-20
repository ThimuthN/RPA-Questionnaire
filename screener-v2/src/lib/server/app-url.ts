export function getAppUrl(request: Request) {
  const configured = process.env.APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  // Vercel sets VERCEL_URL automatically in all deployment environments
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }
  return new URL(request.url).origin;
}
