import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const count = await prisma.offerApprovalStep.count({
    where: {
      approverId: auth.session.userId,
      status: "pending",
      offer: {
        status: "submitted_for_approval",
        candidate: { departmentId: id }
      }
    }
  });

  return NextResponse.json({ count });
}
