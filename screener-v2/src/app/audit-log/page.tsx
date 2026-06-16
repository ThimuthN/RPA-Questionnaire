import type { Metadata } from "next";
import { requireAdminPageSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { AuditLogClient } from "@/components/admin/AuditLogClient";
import { SignalCard } from "@/components/primitives/SignalCard";

export const metadata: Metadata = { title: "Audit Log" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AuditLogPage() {
  await requireAdminPageSession("/audit-log");

  const [logs, total, todayCount, failedCount] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        action: true,
        actorEmail: true,
        targetId: true,
        targetType: true,
        after: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count(),
    prisma.auditLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 86_400_000) } },
    }),
    prisma.auditLog.count({ where: { action: "user_login_failed" } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium text-[color:var(--app-heading)]">Audit Log</h1>
        <p className="mt-1 text-sm text-[color:var(--app-muted)]">
          All authentication and security events across your organization.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SignalCard label="Total events" value={total.toLocaleString()} tone="blue" />
        <SignalCard label="Last 24 hours" value={todayCount.toLocaleString()} tone="emerald" />
        <SignalCard label="Failed logins" value={failedCount.toLocaleString()} tone="amber" />
      </div>

      <AuditLogClient
        initialLogs={logs.map((l) => ({ ...l, actorId: undefined, createdAt: l.createdAt.toISOString() }))}
        initialTotal={total}
        initialPages={pages}
      />
    </div>
  );
}
