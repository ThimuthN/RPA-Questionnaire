export function getAppUrl(request: Request) {
  const configured = process.env.APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return new URL(request.url).origin;
}
