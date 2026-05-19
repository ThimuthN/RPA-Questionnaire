import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { setOrgStatus } from "@/lib/db/candidacies";

const setOrgStatusSchema = z.object({
  orgStatus: z.enum(["active", "talent_pool", "org_rejected"])
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }
  const { session } = auth;

  const { id: candidateId } = await params;

  try {
    const body = await request.json();
    const input = setOrgStatusSchema.parse(body);

    const result = await setOrgStatus(
      candidateId,
      input.orgStatus,
      session.userId ?? undefined
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update org status" },
      { status: 500 }
    );
  }
}
