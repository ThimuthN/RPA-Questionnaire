import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";

export default function LegacyEmployeeEntryPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Employee access disabled</p>
        <h1 className="text-3xl text-[color:var(--app-heading)]">Employee HRMS is outside v1.</h1>
        <p className="text-sm leading-6 text-[color:var(--app-muted)]">
          Northstar v1 is limited to the hiring workflow. Employee onboarding, HRMS profiles, and employee verification
          flows are not active in this release.
        </p>
        <Link href="/jobs">
          <Button type="button" variant="secondary">View careers</Button>
        </Link>
      </Card>
    </section>
  );
}
