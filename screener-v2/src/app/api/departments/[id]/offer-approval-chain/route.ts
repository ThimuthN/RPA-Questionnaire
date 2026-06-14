import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { createRequestLogContext, logRouteError, messageFromError } from "@/lib/server/logger";
import { prisma } from "@/lib/db/prisma";

const upsertChainSchema = z.object({
  steps: z.array(
    z.object({
      approverId: z.string().min(1),
      sortOrder: z.number().int().min(0),
    })
  ),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const logContext = createRequestLogContext(request, "api.offer_approval_chain.get");
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id: departmentId } = await params;

  try {
    const permissionCheck = await requirePermissionForDepartment(auth.session, "manage_users", departmentId);
    if (!permissionCheck.ok) return permissionCheck.response;

    const chain = await prisma.offerApprovalChain.findFirst({
      where: { departmentId },
      include: {
        steps: {
          orderBy: { sortOrder: "asc" },
          include: {
            approver: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({ ok: true, chain: chain ?? null });
  } catch (error) {
    logRouteError("offer_approval_chain_get_failed", logContext, error, { userId: auth.session.userId });
    const message = messageFromError(error, "Failed to load offer approval chain");
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const logContext = createRequestLogContext(request, "api.offer_approval_chain.upsert");
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const { id: departmentId } = await params;

  try {
    const permissionCheck = await requirePermissionForDepartment(auth.session, "manage_users", departmentId);
    if (!permissionCheck.ok) return permissionCheck.response;

    const body = upsertChainSchema.parse(await request.json());

    const dept = await prisma.department.findUnique({ where: { id: departmentId }, select: { id: true } });
    if (!dept) return NextResponse.json({ ok: false, message: "Department not found" }, { status: 404 });

    // Validate all approver IDs exist
    if (body.steps.length > 0) {
      const approverIds = body.steps.map((s) => s.approverId);
      const users = await prisma.user.findMany({ where: { id: { in: approverIds } }, select: { id: true } });
      if (users.length !== approverIds.length) {
        return NextResponse.json({ ok: false, message: "One or more approvers not found" }, { status: 400 });
      }
    }

    const chain = await prisma.$transaction(async (tx) => {
      // Upsert the chain (one per department)
      const existing = await tx.offerApprovalChain.findFirst({ where: { departmentId }, select: { id: true } });

      let chainId: string;
      if (existing) {
        chainId = existing.id;
        await tx.offerApprovalChainStep.deleteMany({ where: { chainId: existing.id } });
      } else {
        const created = await tx.offerApprovalChain.create({
          data: { departmentId, name: "Default" },
          select: { id: true },
        });
        chainId = created.id;
      }

      if (body.steps.length > 0) {
        await tx.offerApprovalChainStep.createMany({
          data: body.steps.map((s) => ({
            chainId,
            approverId: s.approverId,
            sortOrder: s.sortOrder,
          })),
        });
      }

      return tx.offerApprovalChain.findFirst({
        where: { id: chainId },
        include: {
          steps: {
            orderBy: { sortOrder: "asc" },
            include: { approver: { select: { id: true, name: true, email: true } } },
          },
        },
      });
    });

    return NextResponse.json({ ok: true, chain });
  } catch (error) {
    logRouteError("offer_approval_chain_upsert_failed", logContext, error, { userId: auth.session.userId });
    const message = messageFromError(error, "Failed to save offer approval chain");
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
