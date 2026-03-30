import { RunTestClient } from "@/features/run/RunTestClient";
import { getAppSession } from "@/lib/auth/app-session";

export default async function RunTestPage() {
  const session = await getAppSession();
  return <RunTestClient canManageAccess={Boolean(session)} />;
}
