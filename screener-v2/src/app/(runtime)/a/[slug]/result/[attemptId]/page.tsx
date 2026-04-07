import { redirect } from "next/navigation";
import { requireRuntimeAttemptPageAccess } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function RuntimeResultPage({
  params
}: {
  params: Promise<{ slug: string; attemptId: string }>;
}) {
  const { attemptId, slug } = await params;
  await requireRuntimeAttemptPageAccess({ attemptId, slug });
  redirect(`/a/${slug}/attempt/${attemptId}`);
}
