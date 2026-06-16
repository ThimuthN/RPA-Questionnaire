"use client";

import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";

const fieldCn =
  "rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]";

type SelectOption = { value: string; label: string };

export function ApplicantFilterForm({
  action,
  resetHref,
  initialValues,
  jobOptions,
  pageSize
}: {
  action: string;
  resetHref: Route;
  initialValues: Record<string, string | undefined>;
  jobOptions: SelectOption[];
  pageSize: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const submit = useCallback(() => {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (typeof value === "string" && value !== "") {
        params.set(key, value);
      }
    }
    params.set("page", "1");
    router.push(`${action}?${params.toString()}` as Route);
  }, [action, router]);

  const handleSelectChange = useCallback(() => submit(), [submit]);

  const handleSearchChange = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(submit, 420);
  }, [submit]);

  return (
    <div className="space-y-2">
      <form
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="grid gap-3 rounded-[24px] bg-[color:var(--app-surface)] p-4 shadow-[var(--app-shadow-soft)] ring-1 ring-[color:var(--app-border)] xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_auto]"
      >
        <input type="hidden" name="pageSize" value={pageSize} />
        <input
          name="q"
          defaultValue={initialValues.q ?? ""}
          placeholder="Search applicant, email, or job"
          className={fieldCn}
          onChange={handleSearchChange}
        />
        <select
          name="jobId"
          defaultValue={initialValues.jobId ?? ""}
          className={fieldCn}
          onChange={handleSelectChange}
        >
          <option value="">All jobs</option>
          {jobOptions.map((job) => (
            <option key={job.value} value={job.value}>
              {job.label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={initialValues.status ?? ""}
          className={fieldCn}
          onChange={handleSelectChange}
        >
          <option value="">All statuses</option>
          <option value="submitted">Applied</option>
          <option value="under_review">Under review</option>
          <option value="closed">Archived</option>
        </select>
        <select
          name="resume"
          defaultValue={initialValues.resume ?? ""}
          className={fieldCn}
          onChange={handleSelectChange}
        >
          <option value="">Resume status</option>
          <option value="missing">Missing resume</option>
        </select>
        <Link
          href={resetHref}
          className="inline-flex items-center justify-center rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]"
        >
          Reset
        </Link>
      </form>
      <p className="px-1 text-xs text-[color:var(--app-muted)]">
        Filters update automatically.
      </p>
    </div>
  );
}
