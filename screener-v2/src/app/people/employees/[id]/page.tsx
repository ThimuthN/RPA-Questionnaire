'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { EmployeeDetail, EmploymentStatusLabels } from '@/lib/employees/types';
import { EmployeeGoalDetail } from '@/lib/goals/types';
import { PerformanceReviewRecord } from '@/lib/reviews/types';
import { StatusPill } from '@/components/primitives/StatusPill';
import { Button } from '@/components/primitives/Button';
import { EmployeeGoalCard } from '@/components/employees/EmployeeGoalCard';
import { PerformanceReviewCard } from '@/components/employees/PerformanceReviewCard';
import { ReviewFormModal } from '@/components/employees/ReviewFormModal';

type Tab = 'overview' | 'goals' | 'reviews';

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [goals, setGoals] = useState<EmployeeGoalDetail[]>([]);
  const [reviews, setReviews] = useState<PerformanceReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [id, setId] = useState<string>('');
  const [reviewFormOpen, setReviewFormOpen] = useState(false);

  useEffect(() => {
    const initializeParams = async () => {
      const { id: resolvedId } = await params;
      setId(resolvedId);

      try {
        setLoading(true);
        const [empRes, goalsRes, reviewsRes] = await Promise.all([
          fetch(`/api/employees/${resolvedId}`),
          fetch(`/api/employees/${resolvedId}/goals`),
          fetch(`/api/employees/${resolvedId}/reviews`),
        ]);

        if (empRes.ok) {
          const empData: EmployeeDetail = await empRes.json();
          setEmployee(empData);
        }

        if (goalsRes.ok) {
          const goalsData = await goalsRes.json();
          setGoals(goalsData.goals || []);
        }

        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews || []);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeParams();
  }, [params]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!employee) {
    return <div className="p-6">Employee not found</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[color:var(--app-border)] p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-[color:var(--app-brand)] flex items-center justify-center text-white font-display font-semibold text-xl">
              {employee.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-display font-semibold text-[color:var(--app-heading)]">
                {employee.fullName}
              </h1>
              <p className="text-sm text-[color:var(--app-muted)] mt-1">
                {employee.title || 'No title set'}
              </p>
              {employee.department && (
                <p className="text-xs text-[color:var(--app-muted)] mt-1">
                  {employee.department.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <StatusPill
              label={EmploymentStatusLabels[employee.employmentStatus]}
              tone={
                employee.employmentStatus === 'active'
                  ? 'emerald'
                  : employee.employmentStatus === 'on_leave'
                    ? 'amber'
                    : 'neutral'
              }
            />
            <span className="text-xs font-mono font-medium text-[color:var(--app-brand)] bg-[color:var(--app-brand-soft)] rounded-full px-3 py-1.5">
              {employee.employeeNumber}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(['overview', 'goals', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                activeTab === tab
                  ? 'bg-[color:var(--app-brand)] text-white'
                  : 'bg-[color:var(--app-surface-soft)] text-[color:var(--app-text)] hover:bg-[color:var(--app-border)]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && (
          <div className="max-w-4xl space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Employment Details */}
              <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] p-5">
                <h3 className="text-sm font-medium text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-4">
                  Employment
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
                      Type
                    </p>
                    <p className="text-sm font-medium text-[color:var(--app-text)]">
                      {employee.employmentType?.replace(/_/g, ' ') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
                      Start Date
                    </p>
                    <p className="text-sm font-medium text-[color:var(--app-text)]">
                      {new Date(employee.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {employee.probationEndDate && (
                    <div>
                      <p className="text-xs text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
                        Probation Ends
                      </p>
                      <p className="text-sm font-medium text-[color:var(--app-text)]">
                        {new Date(employee.probationEndDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                  {employee.endDate && (
                    <div>
                      <p className="text-xs text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
                        End Date
                      </p>
                      <p className="text-sm font-medium text-[color:var(--app-text)]">
                        {new Date(employee.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Organization */}
              <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] p-5">
                <h3 className="text-sm font-medium text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-4">
                  Organization
                </h3>
                <div className="space-y-4">
                  {employee.role && (
                    <div>
                      <p className="text-xs text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
                        Role
                      </p>
                      <p className="text-sm font-medium text-[color:var(--app-text)]">
                        {employee.role.label}
                      </p>
                    </div>
                  )}
                  {employee.department && (
                    <div>
                      <p className="text-xs text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
                        Department
                      </p>
                      <p className="text-sm font-medium text-[color:var(--app-text)]">
                        {employee.department.name}
                      </p>
                    </div>
                  )}
                  {employee.manager && (
                    <div>
                      <p className="text-xs text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
                        Manager
                      </p>
                      <Link
                        href={`/people/employees/${employee.manager.id}` as Route}
                        className="text-sm font-medium text-[color:var(--app-brand)] hover:underline"
                      >
                        {employee.manager.fullName}
                      </Link>
                    </div>
                  )}
                  {employee.level && (
                    <div>
                      <p className="text-xs text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
                        Level
                      </p>
                      <p className="text-sm font-medium text-[color:var(--app-text)]">
                        {employee.level}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="rounded-[22px] border border-[color:var(--app-border)] bg-[linear-gradient(180deg,var(--app-surface),var(--app-surface-soft))] p-5">
              <h3 className="text-sm font-medium text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-4">
                Contact
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
                    Email
                  </p>
                  <p className="text-sm font-medium text-[color:var(--app-text)]">{employee.email}</p>
                </div>
                {employee.phone && (
                  <div>
                    <p className="text-xs text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
                      Phone
                    </p>
                    <p className="text-sm font-medium text-[color:var(--app-text)]">{employee.phone}</p>
                  </div>
                )}
                {employee.location && (
                  <div>
                    <p className="text-xs text-[color:var(--app-muted)] uppercase tracking-[0.08em] mb-1">
                      Location
                    </p>
                    <p className="text-sm font-medium text-[color:var(--app-text)]">{employee.location}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Application Link */}
            {employee.candidate && (
              <div className="rounded-[22px] border border-[color:var(--pill-blue-border)] bg-[color:var(--pill-blue-bg)] p-5">
                <h3 className="text-sm font-medium text-[color:var(--pill-blue-text)] uppercase tracking-[0.08em] mb-2">
                  From Application
                </h3>
                <p className="text-sm text-[color:var(--pill-blue-text)] mb-3">
                  This employee was hired from a candidate in your pipeline.
                </p>
                <Link href={`/people/candidates/${employee.candidate.id}` as Route}>
                  <Button variant="secondary" className="text-xs">
                    View Original Application
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="max-w-4xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Goals</h2>
              <Button variant="secondary" className="text-xs">
                + Add Goal
              </Button>
            </div>

            {goals.length === 0 ? (
              <div className="rounded-[20px] border border-[color:var(--app-border)] p-6 text-center">
                <p className="text-sm text-[color:var(--app-muted)]">No goals yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal) => (
                  <EmployeeGoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="max-w-4xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[color:var(--app-heading)]">Performance Reviews</h2>
              <Button variant="secondary" className="text-xs" onClick={() => setReviewFormOpen(true)}>
                + Create Review
              </Button>
            </div>

            {reviews.length === 0 ? (
              <div className="rounded-[20px] border border-[color:var(--app-border)] p-6 text-center">
                <p className="text-sm text-[color:var(--app-muted)]">No reviews yet</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {reviews.map((review) => (
                  <PerformanceReviewCard
                    key={review.id}
                    review={review}
                    isReviewer={false}
                    isEmployee={true}
                  />
                ))}
              </div>
            )}

            <ReviewFormModal
              isOpen={reviewFormOpen}
              onClose={() => setReviewFormOpen(false)}
              onSubmit={async (data) => {
                // In a real implementation, this would submit to the API
                console.log('Review submitted:', data);
                setReviewFormOpen(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
