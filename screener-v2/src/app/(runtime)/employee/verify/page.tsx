import Link from "next/link";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";

export default function EmployeeVerifyPage() {
  return (
    <section className="mx-auto max-w-2xl">
      <Card className="space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-300">Verification disabled</p>
        <h1 className="text-3xl text-[color:var(--app-heading)]">Employee verification is not available in v1.</h1>
        <p className="text-sm leading-6 text-[color:var(--app-muted)]">
          Employee magic-link verification and onboarding flows are outside the v1 hiring workflow. This page no longer
          accepts employee tokens or starts employee assessments.
        </p>
        <Link href="/jobs">
          <Button type="button" variant="secondary">View careers</Button>
        </Link>
      </Card>
    </section>
  );
}
