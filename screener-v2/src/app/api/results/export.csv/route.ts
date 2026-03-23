import { listResultWorkspacePage } from "@/lib/db/repositories";
import { resultsToCsv } from "@/lib/exports/results-export";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rows = (
    await listResultWorkspacePage({
      q: searchParams.get("q") || undefined,
      status: (searchParams.get("status") as "pass" | "review" | "fail" | null) ?? undefined,
      integrity: (searchParams.get("integrity") as "clean" | "watch" | "review" | null) ?? undefined,
      role: (searchParams.get("role") as "Intern" | "Associate" | "SE" | "SeniorSE" | "TechLead" | null) ?? undefined,
      owner: searchParams.get("owner") || undefined,
      stage: (searchParams.get("stage") as "new" | "screening" | "interview" | "testing" | "decision" | "offer" | "closed" | null) ?? undefined,
      assessmentStatus: (searchParams.get("assessmentStatus") as "none" | "invited" | "in_progress" | "passed" | "review" | "failed" | null) ?? undefined,
      scoreBand: (searchParams.get("scoreBand") as "high" | "mid" | "low" | null) ?? undefined,
      sort: (searchParams.get("sort") as "newest" | "score_desc" | "score_asc" | "risk_desc" | "stale_desc" | null) ?? undefined,
      page: 1,
      pageSize: 2000
    })
  ).rows;
  const csv = resultsToCsv(rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"innobot_results.csv\"`
    }
  });
}
