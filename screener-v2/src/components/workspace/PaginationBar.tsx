import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";

export function PaginationBar({
  page,
  pageSize,
  total,
  makeHref
}: {
  page: number;
  pageSize: number;
  total: number;
  makeHref: (page: number) => Route;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[color:var(--app-border)] bg-[color:var(--app-surface)] p-4 shadow-[var(--app-shadow-soft)]">
      <div className="flex flex-wrap gap-2">
        <StatusPill label={`Showing ${start}-${end}`} tone="neutral" />
        <StatusPill label={`Total ${total}`} tone="neutral" />
        <StatusPill label={`Page ${page}/${totalPages}`} tone="neutral" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={makeHref(Math.max(1, page - 1))}>
          <Button variant="secondary" disabled={page <= 1}>
            Previous
          </Button>
        </Link>
        <Link href={makeHref(Math.min(totalPages, page + 1))}>
          <Button variant="secondary" disabled={page >= totalPages}>
            Next
          </Button>
        </Link>
      </div>
    </div>
  );
}
