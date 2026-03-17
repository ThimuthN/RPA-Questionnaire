import { RunTestClient } from "@/features/run/RunTestClient";
import { getSession } from "@/lib/auth/session";

export default async function RunTestPage() {
  const session = await getSession();
  return <RunTestClient canManageAccess={Boolean(session)} />;
}
