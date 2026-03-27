import type { Route } from "next";
import { redirect } from "next/navigation";

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
  redirect((`/people/candidates${query.toString() ? `?${query.toString()}` : ""}`) as Route);
}
