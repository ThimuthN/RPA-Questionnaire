import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import {
  getRuntimeSession,
  runtimeSessionMatchesAttempt
} from "@/lib/auth/runtime-session";
import { getResult } from "@/lib/db/repositories";
import { ResultRevealHero } from "@/components/results/ResultRevealHero";
import { SignalCard } from "@/components/primitives/SignalCard";
import { SceneShell } from "@/components/scene/SceneShell";
import { DecisionStage } from "@/components/results/DecisionStage";
import { StagePanel } from "@/components/scene/StagePanel";
import { copy } from "@/lib/design/copy";
import type { ResultSummary } from "@/lib/assessment-engine/types";

export const dynamic = "force-dynamic";

function runtimeEntryHref(slug: string): Route {
  return (slug === "internal" ? "/employee/verify" : `/a/${slug}`) as Route;
}

function buildSignals(row: ResultSummary) {
  const entries = Object.entries(row.breakdownByCategory).sort((a, b) => b[1].percent - a[1].percent);
  const top = entries[0];
  const bottom = entries[entries.length - 1];
  return {
    strength: top ? top[0] : "Not enough data",
    watchout: bottom ? bottom[0] : "No risk area",
    outcome: row.pass ? "Pass" : row.borderline ? "Review" : "Fail"
  };
}

export default async function RuntimeResultPage({
  params
}: {
  params: Promise<{ slug: string; attemptId: string }>;
}) {
  const { attemptId, slug } = await params;
  const runtimeSession = await getRuntimeSession();
  if (!runtimeSessionMatchesAttempt(runtimeSession, { attemptId, slug })) {
    redirect(runtimeEntryHref(slug));
  }
  const result = await getResult(attemptId);
  if (!result) {
    return (
      <section className="space-y-4">
        <StagePanel>
          <h1 className="text-2xl text-white">Result not ready yet</h1>
        </StagePanel>
      </section>
    );
  }
  const signals = buildSignals(result);
  return (
    <SceneShell variant="results" eyebrow={copy.results.eyebrow} title={copy.results.title}>
      <DecisionStage
        hero={<ResultRevealHero row={result} />}
        signals={
          <>
            <SignalCard label={copy.results.outcome} value={signals.outcome} tone={result.pass ? "emerald" : "amber"} />
            <SignalCard label={copy.results.topStrength} value={signals.strength} tone="blue" />
            <SignalCard label={copy.results.watchout} value={signals.watchout} tone="amber" />
          </>
        }
      />
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/">
          <Button>{copy.runtime.finish}</Button>
        </Link>
        {slug === "internal" ? (
          <Link href="/results">
            <Button variant="secondary">View Full Tracking</Button>
          </Link>
        ) : null}
      </div>
    </SceneShell>
  );
}
