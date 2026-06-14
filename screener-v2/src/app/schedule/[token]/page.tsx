import { notFound } from "next/navigation";
import { resolveSchedulingToken } from "@/lib/scheduling/token";
import { SchedulingPageClient } from "./SchedulingPageClient";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await resolveSchedulingToken(token);

  if (result.status === "not_found") notFound();

  if (result.status === "expired") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[color:var(--app-bg)] p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold text-[color:var(--app-heading)]">
            This scheduling link has expired
          </h1>
          <p className="text-sm text-[color:var(--app-muted)]">
            Scheduling links are valid for 72 hours. Please contact the hiring team to receive a new link.
          </p>
        </div>
      </main>
    );
  }

  if (result.status === "used") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[color:var(--app-bg)] p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold text-[color:var(--app-heading)]">
            Interview already scheduled
          </h1>
          <p className="text-sm text-[color:var(--app-muted)]">
            You have already selected a time for this interview. Check your email for the confirmation and calendar invite.
          </p>
        </div>
      </main>
    );
  }

  const { record } = result;
  const { panel } = record;

  const slots = panel.availabilityWindows.map((w) => ({
    id: w.id,
    startsAt: w.startsAt.toISOString(),
    endsAt: w.endsAt.toISOString(),
  }));

  const interviewers = panel.members.map((m) => m.user.name ?? "").filter(Boolean);

  return (
    <main className="min-h-screen bg-[color:var(--app-bg)] p-6">
      <div className="mx-auto max-w-lg space-y-8 py-12">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-[color:var(--app-muted)]">
            Interview scheduling
          </p>
          <h1 className="text-2xl font-semibold text-[color:var(--app-heading)]">
            Hi {panel.candidate.fullName.split(" ")[0]}, select a time
          </h1>
          <p className="text-sm text-[color:var(--app-muted)]">
            {panel.roundName} · {panel.durationMin} min
            {interviewers.length > 0 ? ` · with ${interviewers.join(", ")}` : ""}
          </p>
        </div>

        <SchedulingPageClient token={token} slots={slots} durationMin={panel.durationMin} />
      </div>
    </main>
  );
}
