import Link from "next/link";
import { OfferApprovalChainManagement } from "@/components/departments/OfferApprovalChainManagement";
import { getDepartment } from "@/lib/db/departments";
import { requirePageSession } from "@/lib/auth/guards";
import { canUsePermissionForDepartment } from "@/lib/auth/permission-evaluator";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

export default async function OfferApprovalChainPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await requirePageSession(`/departments/${id}/offer-approval-chain`);

  const [canManage, department, offerApprovalChain, accessGrantTeam, pendingSteps] = await Promise.all([
    canUsePermissionForDepartment(session, "manage_users", id),
    getDepartment(id),
    prisma.offerApprovalChain.findFirst({
      where: { departmentId: id },
      include: {
        steps: {
          orderBy: { sortOrder: "asc" },
          include: { approver: { select: { id: true, name: true, email: true } } }
        }
      }
    }),
    prisma.accessGrant.findMany({
      where: { departmentId: id, scope: "department", status: "active" },
      select: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { user: { name: "asc" } }
    }),
    prisma.offerApprovalStep.findMany({
      where: {
        approverId: session.userId,
        status: "pending",
        offer: {
          status: "submitted_for_approval",
          candidate: { departmentId: id }
        }
      },
      include: {
        offer: {
          include: {
            candidate: { select: { id: true, fullName: true, email: true } },
            approvalSteps: {
              orderBy: { sortOrder: "asc" },
              include: { approver: { select: { name: true, email: true } } }
            }
          }
        }
      },
      orderBy: { sortOrder: "asc" }
    })
  ]);

  if (!department) {
    notFound();
  }

  const teamUsers = accessGrantTeam.map((g) => ({
    id: g.user.id,
    name: g.user.name,
    email: g.user.email
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl text-[color:var(--app-heading)]">Offer approvals</h2>
        <p className="text-sm text-[color:var(--app-muted)]">
          Review offers pending your approval, or configure the department approval chain.
        </p>
      </div>

      {/* ── Pending approvals work queue ───────────────────── */}
      <div>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
          Pending your approval
        </h3>

        {pendingSteps.length === 0 ? (
          <div className="rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] px-5 py-8 text-center">
            <p className="text-sm text-[color:var(--app-muted)]">No offers are currently awaiting your approval.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[color:var(--app-border)] bg-[color:var(--app-table-head)] text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Candidate</th>
                    <th scope="col" className="px-4 py-3 font-medium">Your step</th>
                    <th scope="col" className="px-4 py-3 font-medium">Total steps</th>
                    <th scope="col" className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSteps.map((step) => {
                    const totalSteps = step.offer.approvalSteps.length;
                    const myStepOrder = step.sortOrder;
                    const candidate = step.offer.candidate;
                    return (
                      <tr
                        key={step.id}
                        className="border-t border-[color:var(--app-border)] transition hover:bg-[color:var(--app-table-row-hover)]"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-[color:var(--app-heading)]">{candidate.fullName}</p>
                          <p className="text-xs text-[color:var(--app-muted)]">{candidate.email}</p>
                        </td>
                        <td className="px-4 py-3 text-[color:var(--app-text)]">
                          Step {myStepOrder + 1}
                        </td>
                        <td className="px-4 py-3 text-[color:var(--app-text)]">
                          {totalSteps} step{totalSteps !== 1 ? "s" : ""}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/people/candidates/${candidate.id}?tab=offer`}
                            className="inline-flex items-center gap-1.5 rounded-[10px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-3 py-1.5 text-xs font-medium text-[color:var(--app-heading)] shadow-[var(--app-shadow-soft)] transition hover:bg-[color:var(--app-surface-soft)]"
                          >
                            Review offer
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Approval chain configuration (admins only) ─────── */}
      {canManage ? (
        <div className="border-t border-[color:var(--app-border)] pt-8">
          <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
            Approval chain configuration
          </h3>
          <p className="mb-4 text-xs text-[color:var(--app-muted)]">
            Define the ordered sequence of approvers required before any offer in this department can be sent. Approvers are notified by email and in-app when their step is due.
          </p>
          <OfferApprovalChainManagement
            departmentId={id}
            initialSteps={(offerApprovalChain?.steps ?? []).map((s) => ({
              id: s.id,
              sortOrder: s.sortOrder,
              approver: { id: s.approver.id, name: s.approver.name, email: s.approver.email }
            }))}
            teamUsers={teamUsers}
          />
        </div>
      ) : null}
    </div>
  );
}
