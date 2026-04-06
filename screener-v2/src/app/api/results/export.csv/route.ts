import { requireApiSession } from "@/lib/auth/guards";
import { listAllResultWorkspaceRows } from "@/lib/db/repositories";
import { resultsToCsv } from "@/lib/exports/results-export";
import { parseResultsWorkspaceQuery } from "@/lib/results/query";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const query = parseResultsWorkspaceQuery(searchParams, { page: 1, pageSize: 2000 });
  const rows = await listAllResultWorkspaceRows(query);
  const csv = resultsToCsv(rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"innobot_results.csv\"`
    }
  });
}
