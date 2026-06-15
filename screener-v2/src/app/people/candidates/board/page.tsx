import { requirePageSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

import { SceneTransition } from "@/components/motion/SceneTransition";
import { SceneShell } from "@/components/scene/SceneShell";
import { PeopleViewSwitch } from "@/components/people/PeopleViewSwitch";
import { CandidateWorkspaceBoard } from "@/components/candidates/CandidateWorkspaceBoard";

export const dynamic = "force-dynamic";

const BOARD_STAGES = ["pipeline", "screening", "interview", "advanced_review", "finalized"] as const;
type BoardStage = (typeof BOARD_STAGES)[number];

export type BoardCandidate = {
  id: string;
  fullName: string;
  email: string;
  stage: string;
  currentTitle: string | null;
  roleLabel: string | null;
  staleDays: number;
};

export type BoardColumn = {
  stage: BoardStage;
  label: string;
  candidates: BoardCandidate[];
};

const STAGE_LABELS: Record<BoardStage, string> = {
  pipeline: "Pipeline",
  screening: "Screening",
  interview: "Interview",
  advanced_review: "Review",
  finalized: "Final",
};

export default async function CandidateBoardPage() {
  const session = await requirePageSession("/people/candidates/board");

  const candidates = await prisma.candidate.findMany({
    where: {
      orgStage: "active",
      stage: { in: [...BOARD_STAGES] },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      stage: true,
      currentTitle: true,
      updatedAt: true,
      role: { select: { label: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const columns: BoardColumn[] = BOARD_STAGES.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    candidates: candidates
      .filter((c) => c.stage === stage)
      .map((c) => ({
        id: c.id,
        fullName: c.fullName,
        email: c.email,
        stage: c.stage,
        currentTitle: c.currentTitle,
        roleLabel: c.role?.label ?? null,
        staleDays: Math.floor((Date.now() - c.updatedAt.getTime()) / 86_400_000),
      })),
  }));

  const canEdit = session.permissions.includes("edit_candidate");

  return (
    <SceneTransition>
      <SceneShell
        variant="results"
        tone="page"
        eyebrow="Hiring"
        title="Pipeline board"
        subtitle="Drag candidates between stages to advance them through the hiring pipeline."
        utility={<PeopleViewSwitch current="board" />}
      >
        <CandidateWorkspaceBoard columns={columns} canEdit={canEdit} />
      </SceneShell>
    </SceneTransition>
  );
}
