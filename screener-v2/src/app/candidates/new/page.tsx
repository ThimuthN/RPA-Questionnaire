import type { Route } from "next";
import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/auth/guards";

export default async function NewCandidatePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; existingId?: string; existingName?: string; existingEmail?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.error) query.set("error", params.error);
  if (params.existingId) query.set("existingId", params.existingId);
  if (params.existingName) query.set("existingName", params.existingName);
  if (params.existingEmail) query.set("existingEmail", params.existingEmail);

  const nextPath = `/people/candidates/new${query.toString() ? `?${query.toString()}` : ""}`;
  await requirePageSession(nextPath);
  redirect((nextPath) as Route);
}
