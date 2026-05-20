import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { setOrgStatus } from "@/lib/db/candidacies";
import { prisma } from "@/lib/db/prisma";

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

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { departmentId: true }
    });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }
    const permission = await requirePermissionForDepartment(session, "manage_candidates", candidate.departmentId);
    if (!permission.ok) return permission.response;

    const result = await setOrgStatus(
      candidateId,
      input.orgStatus,
      session.userId ?? undefined,
      session.name || session.email || "System"
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
