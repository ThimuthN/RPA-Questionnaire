import { ApplicantWorkspaceView } from "@/components/candidates/ApplicantWorkspaceView";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { SceneShell } from "@/components/scene/SceneShell";
import { type RouteSearchParams } from "@/lib/http/search-params";

export const dynamic = "force-dynamic";

export default async function CandidateApplicantsPage({
  searchParams
}: {
  searchParams: Promise<RouteSearchParams>;
}) {
  return (
    <SceneShell
      variant="results"
      tone="page"
      eyebrow="Hiring"
      title="Applicants"
      subtitle="Review people who applied to published jobs before moving them into the candidate pipeline."
      utility={<PeopleViewSwitch current="candidates" />}
    >
      <ApplicantWorkspaceView
        scope="global"
        searchParams={await searchParams}
      />
    </SceneShell>
  );
}
