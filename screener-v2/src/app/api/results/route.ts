import { NextResponse } from "next/server";
import { listResultWorkspacePage } from "@/lib/db/repositories";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await listResultWorkspacePage({
    q: searchParams.get("q") || undefined,
    status: (searchParams.get("status") as "pass" | "review" | "fail" | null) ?? undefined,
    integrity: (searchParams.get("integrity") as "clean" | "watch" | "review" | null) ?? undefined,
    role: (searchParams.get("role") as "Intern" | "Associate" | "SE" | "SeniorSE" | "TechLead" | null) ?? undefined,
    owner: searchParams.get("owner") || undefined,
    stage: (searchParams.get("stage") as "new" | "screening" | "interview" | "testing" | "decision" | "offer" | "closed" | null) ?? undefined,
    assessmentStatus: (searchParams.get("assessmentStatus") as "none" | "invited" | "in_progress" | "passed" | "review" | "failed" | null) ?? undefined,
    scoreBand: (searchParams.get("scoreBand") as "high" | "mid" | "low" | null) ?? undefined,
    sort: (searchParams.get("sort") as "newest" | "score_desc" | "score_asc" | "risk_desc" | "stale_desc" | null) ?? undefined,
    page: Number(searchParams.get("page") || 1),
    pageSize: Number(searchParams.get("pageSize") || 12)
  });
  return NextResponse.json({
    ok: true,
    count: result.total,
    rows: result.rows
  });
}
