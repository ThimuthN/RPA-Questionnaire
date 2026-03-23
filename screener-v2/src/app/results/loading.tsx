import { StagePanel } from "@/components/scene/StagePanel";

export default function ResultsLoading() {
  return (
    <section className="space-y-4">
      <StagePanel>
        <p className="text-slate-200">Loading results...</p>
      </StagePanel>
    </section>
  );
}
