import { SceneTransition } from "@/components/motion/SceneTransition";
import { CandidateWorkspaceView } from "@/components/candidates/CandidateWorkspaceView";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { SceneShell } from "@/components/scene/SceneShell";
import { type RouteSearchParams } from "@/lib/http/search-params";

export const dynamic = "force-dynamic";

export default async function PeopleCandidatesPage({
  searchParams
}: {
  searchParams: Promise<RouteSearchParams>;
}) {
  return (
    <SceneTransition>
      <SceneShell
        variant="results"
        tone="page"
        eyebrow="Hiring"
        title="Candidates"
        subtitle="Search the candidate database, review pipeline stage, and open profiles for evidence and decisions."
        utility={<PeopleViewSwitch current="candidates" />}
      >
        <CandidateWorkspaceView
          scope="global"
          searchParams={await searchParams}
        />
      </SceneShell>
    </SceneTransition>
  );
}
