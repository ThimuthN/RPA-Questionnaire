import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, message: "Zoom webhook sync is not active in phase 1." },
    { status: 501 }
  );
}
