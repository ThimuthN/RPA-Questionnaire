import { RunTestClient } from "@/features/run/RunTestClient";
import { getAppSession as getSession } from "@/lib/auth/app-session";

export default async function RunTestPage() {
  const session = await getSession();
  return <RunTestClient canManageAccess={Boolean(session)} />;
}
