import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { listResultWorkspacePage } from "@/lib/db/repositories";
import { parseResultsWorkspaceQuery } from "@/lib/results/query";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const query = parseResultsWorkspaceQuery(searchParams);
  const result = await listResultWorkspacePage(query);
  return NextResponse.json({
    ok: true,
    count: result.total,
    rows: result.rows
  });
}
