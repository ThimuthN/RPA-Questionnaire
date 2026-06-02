import { requireApiSession } from "@/lib/auth/guards";
import { getCandidateStageCounts } from "@/lib/db/candidates";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  return Response.json(await getCandidateStageCounts());
}
