import { StagePanel } from "@/components/scene/StagePanel";

export default function CandidatesLoading() {
  return (
    <section className="space-y-4">
      <StagePanel>
        <p className="text-slate-200">Loading candidates workspace...</p>
      </StagePanel>
    </section>
  );
}
