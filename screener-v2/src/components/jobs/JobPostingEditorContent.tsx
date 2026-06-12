import Link from "next/link";
import type { Route } from "next";
import type { ComponentProps } from "react";
import { Button } from "@/components/primitives/Button";
import { StatusPill } from "@/components/primitives/StatusPill";
import { JobDescriptionContent } from "@/components/jobs/JobDescriptionContent";
import { JobPostingForm } from "@/components/jobs/JobPostingForm";
import { StagePanel } from "@/components/scene/StagePanel";
import {
  candidateApplicationStatusLabels,
  type CandidateApplicationListItem,
  type JobPostingDetail
} from "@/lib/jobs/types";

type LinkHref = ComponentProps<typeof Link>["href"];

function applicationTone(status: string): "neutral" | "blue" | "amber" | "emerald" {
  if (status === "under_review") return "amber";
  if (status === "moved_to_pipeline") return "emerald";
  if (status === "closed") return "blue";
  return "neutral";
}

type NoticeState = {
  created?: string;
  updated?: string;
  error?: string;
};

export function JobPostingEditorContent({
  job,
  pageState,
  roleOptions,
  presetOptions,
  departmentId,
  cancelHref,
  editorHref,
  applicantListHref
}: {
  job: JobPostingDetail;
  pageState: NoticeState;
  roleOptions: Array<{ id: string; label: string; department?: string; isActive?: boolean }>;
  presetOptions: Array<{ id: string; label: string }>;
  departmentId?: string;
  cancelHref: Route;
  editorHref: string;
  applicantListHref: LinkHref;
}) {
  const applicationReviewHref = (applicationId: string) =>
    departmentId
      ? (`/departments/${departmentId}/applicants/${applicationId}` as Route)
      : (`/people/candidates/applicants/${applicationId}` as Route);

  const candidateProfileHref = (candidateId: string) => {
    if (!departmentId) {
      return `/people/candidates/${candidateId}` as Route;
    }

    const params = new URLSearchParams({
      workspaceId: departmentId,
      returnTo: editorHref
    });
    return `/people/candidates/${candidateId}?${params.toString()}` as Route;
  };

  return (
    <>
      {pageState.created || pageState.updated ? (
        <div className="space-y-2">
          {pageState.created ? (
            <p className="rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              Job created.
            </p>
          ) : null}
          {pageState.updated ? (
            <p className="rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              Job updated.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <StagePanel className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl text-[color:var(--app-heading)]">Job details</h2>
            <p className="text-sm text-[color:var(--app-muted)]">
              Keep the public listing clear and easy to scan.
            </p>
          </div>
          <JobPostingForm
            action={`/api/jobs/${job.id}`}
            submitLabel="Save job"
            cancelHref={cancelHref}
            returnTo={editorHref}
            job={job}
            initialError={pageState.error}
            roleOptions={roleOptions}
            presetOptions={presetOptions}
            departmentId={departmentId}
          />
        </StagePanel>

        <div className="space-y-4">
          <StagePanel tone="summary" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusPill
                label={job.isPublished ? "Published" : "Draft"}
                tone={job.isPublished ? "emerald" : "neutral"}
              />
              <StatusPill
                label={job.isOpen ? "Open" : "Closed"}
                tone={job.isOpen ? "blue" : "amber"}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[color:var(--app-heading)]">Applicants</p>
              <p className="text-3xl text-[color:var(--app-heading)]">{job.applicantCount}</p>
            </div>
            <Link href={applicantListHref}>
              <Button type="button" className="w-full">
                Review applicants
              </Button>
            </Link>
            <div className="space-y-2">
              <p className="text-sm text-[color:var(--app-muted)]">Public link</p>
              <Link
                href={`/jobs/${job.slug}`}
                className="text-sm text-[color:var(--app-brand)] hover:underline"
              >
                /jobs/{job.slug}
              </Link>
            </div>
            <div className="space-y-2 border-t border-[color:var(--app-border)] pt-4">
              <p className="text-sm text-[color:var(--app-heading)]">
                Application screening package
              </p>
              {job.screenerPresetLabel ? (
                <div className="space-y-2">
                  <StatusPill label={job.screenerPresetLabel} tone="blue" />
                  <p className="text-xs text-[color:var(--app-muted)]">
                    Applicants complete this during application when supported.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[color:var(--app-muted)]">
                  No screening package is attached.
                </p>
              )}
            </div>

            <div className="space-y-2 border-t border-[color:var(--app-border)] pt-4">
              <p className="text-sm text-[color:var(--app-heading)]">Availability</p>
              <div className="flex flex-wrap gap-2">
                <form action={`/api/jobs/${job.id}`} method="post">
                  <input type="hidden" name="action" value="toggle_published" />
                  <input type="hidden" name="returnTo" value={editorHref} />
                  <Button type="submit" variant="ghost" className="px-3 py-2 text-xs">
                    {job.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                </form>
                <form action={`/api/jobs/${job.id}`} method="post">
                  <input type="hidden" name="action" value="toggle_open" />
                  <input type="hidden" name="returnTo" value={editorHref} />
                  <Button type="submit" variant="ghost" className="px-3 py-2 text-xs">
                    {job.isOpen ? "Close applications" : "Open applications"}
                  </Button>
                </form>
              </div>
              <Link href={`/jobs/${job.slug}`}>
                <Button type="button" variant="secondary" className="w-full">
                  View public page
                </Button>
              </Link>
            </div>
          </StagePanel>

          <StagePanel className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl text-[color:var(--app-heading)]">Recent applicants</h2>
              <p className="text-sm text-[color:var(--app-muted)]">
                Keep the latest intake close to the job instead of jumping back to the queue.
              </p>
            </div>

            {job.recentApplications.length === 0 ? (
              <p className="text-sm text-[color:var(--app-muted)]">
                No applicants yet for this opening.
              </p>
            ) : (
              <div className="space-y-3">
                {job.recentApplications.map((application: CandidateApplicationListItem) => (
                  <div
                    key={application.id}
                    className="space-y-2 rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-surface-soft)] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill
                        label={candidateApplicationStatusLabels[application.status]}
                        tone={applicationTone(application.status)}
                      />
                      <StatusPill
                        label={new Date(application.appliedAt).toLocaleDateString()}
                        tone="neutral"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-[color:var(--app-heading)]">
                        {application.candidateName}
                      </p>
                      <p className="text-xs text-[color:var(--app-muted)]">
                        {application.candidateEmail}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={applicationReviewHref(application.id)}>
                        <Button type="button" className="px-3 py-2 text-xs">
                          Review application
                        </Button>
                      </Link>
                      <Link href={candidateProfileHref(application.candidateId)}>
                        <Button type="button" variant="secondary" className="px-3 py-2 text-xs">
                          Open candidate
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}

                <Link href={applicantListHref}>
                  <Button type="button" variant="ghost" className="w-full">
                    View all applicants
                  </Button>
                </Link>
              </div>
            )}
          </StagePanel>

          <StagePanel className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl text-[color:var(--app-heading)]">Public description</h2>
              <p className="text-sm text-[color:var(--app-muted)]">
                Preview the formatted description exactly as applicants will read it.
              </p>
            </div>
            <JobDescriptionContent html={job.description} />
          </StagePanel>
        </div>
      </div>
    </>
  );
}
