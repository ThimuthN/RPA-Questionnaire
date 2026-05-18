'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EmployeeRecord, EmployeeWorkspacePage, EmploymentStatusLabels } from '@/lib/employees/types';
import { StatusPill } from '@/components/primitives/StatusPill';
import { Button } from '@/components/primitives/Button';
import { Search } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          ...(search && { search }),
          ...(departmentFilter && { departmentId: departmentFilter }),
          ...(statusFilter && { status: statusFilter }),
        });

        const res = await fetch(`/api/employees?${params}`);
        if (res.ok) {
          const data: EmployeeWorkspacePage = await res.json();
          setEmployees(data.items);
          setTotal(data.total);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [page, search, departmentFilter, statusFilter, pageSize]);

  const hasMore = (page * pageSize) < total;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 p-6 border-b border-[color:var(--app-border)]">
        <div>
          <h1 className="text-2xl font-display font-semibold text-[color:var(--app-heading)]">Employees</h1>
          <p className="text-sm text-[color:var(--app-muted)]">{total} total</p>
        </div>
        <Link href="/people/employees/new">
          <Button variant="primary">Add Employee</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 px-6 pb-4">
        <div className="flex-1 flex items-center gap-2 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2">
          <Search className="w-4 h-4 text-[color:var(--app-muted)]" />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-2 text-sm focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {employees.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-base text-[color:var(--app-text)] mb-2">No employees found</p>
              <p className="text-sm text-[color:var(--app-muted)]">Get started by adding your first employee</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--app-border)]">
                <th className="text-left py-3 px-4 font-medium text-[color:var(--app-muted)] text-xs uppercase tracking-[0.08em]">
                  ID
                </th>
                <th className="text-left py-3 px-4 font-medium text-[color:var(--app-muted)] text-xs uppercase tracking-[0.08em]">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-medium text-[color:var(--app-muted)] text-xs uppercase tracking-[0.08em]">
                  Title
                </th>
                <th className="text-left py-3 px-4 font-medium text-[color:var(--app-muted)] text-xs uppercase tracking-[0.08em]">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-[color:var(--app-muted)] text-xs uppercase tracking-[0.08em]">
                  Start Date
                </th>
                <th className="text-left py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-[color:var(--app-border)] hover:bg-[color:var(--app-surface-soft)] transition-colors">
                  <td className="py-3 px-4">
                    <span className="text-xs font-mono font-medium text-[color:var(--app-brand)]">
                      {emp.employeeNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-[color:var(--app-text)]">{emp.fullName}</span>
                    <br />
                    <span className="text-xs text-[color:var(--app-muted)]">{emp.email}</span>
                  </td>
                  <td className="py-3 px-4 text-[color:var(--app-text)]">{emp.title || '—'}</td>
                  <td className="py-3 px-4">
                    <StatusPill
                      label={EmploymentStatusLabels[emp.employmentStatus]}
                      tone={emp.employmentStatus === 'active' ? 'emerald' : emp.employmentStatus === 'on_leave' ? 'amber' : 'neutral'}
                    />
                  </td>
                  <td className="py-3 px-4 text-[color:var(--app-text)] text-xs">
                    {new Date(emp.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/people/employees/${emp.id}`} className="text-[color:var(--app-brand)] hover:underline text-sm font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {employees.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-[color:var(--app-border)]">
          <p className="text-xs text-[color:var(--app-muted)]">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-full border border-[color:var(--app-border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasMore}
              className="rounded-full border border-[color:var(--app-border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
