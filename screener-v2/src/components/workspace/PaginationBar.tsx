import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/primitives/Button";

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

  // Single page with nothing to navigate: keep the footer out of the way.
  if (totalPages <= 1) {
    return (
      <p className="px-1 text-xs text-[color:var(--app-muted)]">
        {total === 0 ? "No results" : `${start}–${end} of ${total}`}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <p className="text-xs text-[color:var(--app-muted)]">
        {start}–{end} of {total} · Page {page}/{totalPages}
      </p>
      <div className="flex gap-2">
        <Link href={makeHref(Math.max(1, page - 1))}>
          <Button variant="secondary" disabled={page <= 1} className="px-3 py-1.5 text-xs">
            Previous
          </Button>
        </Link>
        <Link href={makeHref(Math.min(totalPages, page + 1))}>
          <Button variant="secondary" disabled={page >= totalPages} className="px-3 py-1.5 text-xs">
            Next
          </Button>
        </Link>
      </div>
    </div>
  );
}
