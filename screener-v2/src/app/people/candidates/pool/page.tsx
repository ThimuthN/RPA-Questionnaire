import { SceneShell } from "@/components/scene/SceneShell";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { CandidatesViewSwitch } from "@/components/candidates/CandidatesViewSwitch";
import { SceneTransition } from "@/components/motion/SceneTransition";
import { TalentPoolWorkspaceView } from "@/components/candidates/TalentPoolWorkspaceView";
import { requirePageSession } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function GlobalTalentPoolPage() {
  await requirePageSession("/people/candidates/pool");
  return (
    <SceneTransition>
      <SceneShell
        variant="results"
        tone="page"
        eyebrow="Hiring"
        title="Talent pool"
        subtitle="Candidates not in an active pipeline. Re-engage when a suitable role opens."
        utility={<PeopleViewSwitch current="candidates" />}
      >
        <div className="space-y-5">
          <CandidatesViewSwitch current="pool" scope="global" />
          <TalentPoolWorkspaceView scope="global" />
        </div>
      </SceneShell>
    </SceneTransition>
  );
}
