"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Loader2 } from "lucide-react";

export function JobApplicationForm({ jobSlug }: { jobSlug: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
  };

  return (
    <form
      action={`/api/jobs/${jobSlug}/apply`}
      method="post"
      encType="multipart/form-data"
      className="space-y-5"
      onSubmit={handleSubmit}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[color:var(--app-heading)]">Contact details</p>
          <p className="text-sm text-[color:var(--app-muted)]">Use the details the hiring team should contact you on.</p>
        </div>
        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm text-[color:var(--app-text)]">Full name</span>
            <input
              name="fullName"
              required
              placeholder="Jane Doe"
              disabled={isSubmitting}
              className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm text-[color:var(--app-text)]">Email</span>
              <input
                name="email"
                type="email"
                required
                placeholder="jane@example.com"
                disabled={isSubmitting}
                className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm text-[color:var(--app-text)]">Phone</span>
              <input
                name="phone"
                placeholder="+94 77 123 4567"
                disabled={isSubmitting}
                className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-[color:var(--app-border)] pt-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[color:var(--app-heading)]">Resume</p>
          <p className="text-sm text-[color:var(--app-muted)]">Upload a PDF if you want to include one with this application.</p>
        </div>
        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">Resume</span>
          <input
            name="resume"
            type="file"
            accept=".pdf,application/pdf"
            disabled={isSubmitting}
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-sm text-[color:var(--app-text)] disabled:opacity-50"
          />
        </label>
      </div>

      <div className="space-y-3 border-t border-[color:var(--app-border)] pt-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[color:var(--app-heading)]">Message</p>
          <p className="text-sm text-[color:var(--app-muted)]">Add a short note if there is anything the team should know.</p>
        </div>
        <label className="grid gap-1.5">
          <span className="text-sm text-[color:var(--app-text)]">Cover note</span>
          <textarea
            name="coverNote"
            rows={5}
            disabled={isSubmitting}
            placeholder="Share a short introduction, relevant experience, or anything else that helps your application."
            className="rounded-[18px] border border-[color:var(--app-border)] bg-[color:var(--app-control-bg)] px-4 py-3 text-[color:var(--app-text)] placeholder:text-[color:var(--app-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80 disabled:opacity-50"
          />
        </label>
      </div>

      <div className="space-y-3 border-t border-[color:var(--app-border)] pt-4">
        <p className="text-xs leading-6 text-[color:var(--app-muted)]">
          By submitting, you are sharing this information with the hiring team for review on this role.
        </p>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full justify-center disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Apply now"
          )}
        </Button>
      </div>
    </form>
  );
}
