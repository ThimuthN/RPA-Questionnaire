import { NextResponse } from "next/server";
import { listResults } from "@/lib/db/repositories";

export async function GET() {
  const rows = await listResults();
  return NextResponse.json({
    ok: true,
    exportedAt: new Date().toISOString(),
    rows
  });
}
