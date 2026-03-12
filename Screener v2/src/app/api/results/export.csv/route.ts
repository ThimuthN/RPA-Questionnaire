import { listResults } from "@/lib/db/repositories";
import { resultsToCsv } from "@/lib/exports/results-export";

export async function GET() {
  const rows = await listResults();
  const csv = resultsToCsv(rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"innobot_results.csv\"`
    }
  });
}
