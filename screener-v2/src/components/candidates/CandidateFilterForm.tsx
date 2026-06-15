"use client";

import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";

const fieldCn =
  "rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none transition focus:border-brand-300/50 focus:bg-[color:var(--app-control-bg-strong)]";

type SelectOption = { value: string; label: string };

export function CandidateFilterForm({
  action,
  resetHref,
  initialValues,
  roleOptions,
  ownerOptions,
  assessmentStatusOptions,
  departmentOptions,
  showDepartment,
  showFinalizedAs,
  pageSize
}: {
  action: string;
  resetHref: Route;
  initialValues: Record<string, string | undefined>;
  roleOptions: SelectOption[];
  ownerOptions: SelectOption[];
  assessmentStatusOptions: SelectOption[];
  departmentOptions?: SelectOption[];
  showDepartment?: boolean;
  showFinalizedAs?: boolean;
  pageSize: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const submit = useCallback(() => {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const params = new URLSearchParams();
    for (const [k, v] of data.entries()) {
      if (typeof v === "string" && v !== "") params.set(k, v);
    }
    // Always reset to page 1 on filter change
    params.set("page", "1");
    router.push(`${action}?${params.toString()}` as Route);
  }, [action, router]);

  const handleSelectChange = useCallback(() => submit(), [submit]);

  const handleSearchChange = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(submit, 420);
  }, [submit]);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className="grid gap-3 rounded-[24px] bg-[color:var(--app-surface)] p-4 shadow-[var(--app-shadow-soft)] ring-1 ring-[color:var(--app-border)] xl:grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,0.9fr))_auto]"
    >
      <input type="hidden" name="pageSize" value={pageSize} />

      <input
        name="q"
        defaultValue={initialValues.q ?? ""}
        placeholder="Search candidate, email, or owner"
        className={fieldCn}
        onChange={handleSearchChange}
      />

      <select name="roleId" defaultValue={initialValues.roleId ?? ""} className={fieldCn} onChange={handleSelectChange}>
        <option value="">All roles</option>
        {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {showDepartment && departmentOptions ? (
        <select name="departmentId" defaultValue={initialValues.departmentId ?? ""} className={fieldCn} onChange={handleSelectChange}>
          <option value="">All departments</option>
          {departmentOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : null}

      <select name="owner" defaultValue={initialValues.owner ?? ""} className={fieldCn} onChange={handleSelectChange}>
        <option value="">All owners</option>
        {ownerOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select name="assessmentStatus" defaultValue={initialValues.assessmentStatus ?? ""} className={fieldCn} onChange={handleSelectChange}>
        <option value="">Assessment status</option>
        {assessmentStatusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {showFinalizedAs ? (
        <select name="finalizedAs" defaultValue={initialValues.finalizedAs ?? ""} className={fieldCn} onChange={handleSelectChange}>
          <option value="">All finalized</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>
      ) : null}

      <select name="sort" defaultValue={initialValues.sort ?? "inbox"} className={fieldCn} onChange={handleSelectChange}>
        <option value="inbox">Sort by</option>
        <option value="updated_desc">Recently updated</option>
        <option value="updated_asc">Least recently updated</option>
        <option value="stale_desc">Longest inactive</option>
        <option value="name_asc">Name (A–Z)</option>
      </select>

      <Link
        href={resetHref}
        className="inline-flex items-center justify-center rounded-[16px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] transition hover:bg-[color:var(--app-surface-soft)]"
      >
        Reset
      </Link>
    </form>
  );
}
