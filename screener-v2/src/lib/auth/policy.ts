const authRequiredPrefixes = [
  "/assessments",
  "/candidates",
  "/addons",
  "/create-test",
  "/people",
  "/results",
  "/studio",
  "/users",
  "/api/candidates",
  "/api/candidate-applications",
  "/api/results",
  "/api/jobs",
  "/api/invites/create",
  "/api/auth/magic/request",
  "/api/users",
  "/api/roles",
  "/api/addons",
  "/api/addon-presets"
] as const;

const adminOnlyPrefixes = ["/users", "/api/users"] as const;

export function matchesPolicyPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isAuthRequiredPath(pathname: string) {
  if (/^\/api\/jobs\/[^/]+\/apply$/.test(pathname)) {
    return false;
  }
  return matchesPolicyPrefix(pathname, authRequiredPrefixes);
}

export function isAdminOnlyPath(pathname: string) {
  return matchesPolicyPrefix(pathname, adminOnlyPrefixes);
}
