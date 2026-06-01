import type { Route } from "next";
import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/auth/guards";

export default async function CandidateDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string;
    updated?: string;
    noteAdded?: string;
    resumeUploaded?: string;
    error?: string;
  }>;
}) {
  const { id } = await params;
  const pageState = await searchParams;

  const query = new URLSearchParams();
  if (pageState.created) query.set("created", pageState.created);
  if (pageState.updated) query.set("updated", pageState.updated);
  if (pageState.noteAdded) query.set("noteAdded", pageState.noteAdded);
  if (pageState.resumeUploaded) query.set("resumeUploaded", pageState.resumeUploaded);
  if (pageState.error) query.set("error", pageState.error);

  const nextPath = `/people/candidates/${id}${query.toString() ? `?${query.toString()}` : ""}`;
  await requirePageSession(nextPath);
  redirect((nextPath) as Route);
}
