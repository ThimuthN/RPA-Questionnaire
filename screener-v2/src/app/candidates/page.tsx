import type { Route } from "next";
import { redirect } from "next/navigation";
import { buildLoginHref, getAppSession } from "@/lib/auth/app-session";

export default async function CandidatesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) query.set(key, value);
  }
  const nextPath = `/candidates${query.toString() ? `?${query.toString()}` : ""}`;
  if (!(await getAppSession())) {
    redirect(buildLoginHref(nextPath));
  }
  redirect((`/people/candidates${query.toString() ? `?${query.toString()}` : ""}`) as Route);
}
