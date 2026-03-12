import { redirect } from "next/navigation";

export default async function LegacyEditPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/create-test?template=${encodeURIComponent(id)}`);
}
