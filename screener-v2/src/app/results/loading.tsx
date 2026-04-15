import { StagePanel } from "@/components/scene/StagePanel";

export default function ResultsLoading() {
  return (
    <section className="space-y-4">
      <StagePanel>
        <p className="text-[color:var(--app-text)]">Loading results...</p>
      </StagePanel>
    </section>
  );
}
