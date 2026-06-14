import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/guards", () => ({
  requireApiSession: vi.fn(),
  requirePermissionForDepartment: vi.fn()
}));

vi.mock("@/lib/tokens/token-service", () => ({
  cuidLike: () => "event-123"
}));

vi.mock("@/lib/server/logger", () => ({
  createRequestLogContext: () => ({}),
  logRouteError: vi.fn()
}));

import { prisma } from "@/lib/db/prisma";
import { disconnectTestDatabase, truncateTestDatabase } from "@/test/db";
import { requireApiSession, requirePermissionForDepartment } from "@/lib/auth/guards";
import { POST as hireCandidate } from "./hire/route";
import { POST as rejectCandidate } from "./reject/route";
import { POST as revertFinalization } from "./revert-finalization/route";

const mockSession = {
  userId: "user-1",
  name: "Test User",
  email: "tester@example.com",
  permissions: ["manage_candidates"]
};

let sequence = 0;

function nextSuffix() {
  sequence += 1;
  return `db-${Date.now()}-${sequence}`;
}

async function createDepartment() {
  const suffix = nextSuffix();
  return prisma.department.create({
    data: {
      slug: `dept-${suffix}`,
      name: `Department ${suffix}`
    }
  });
}

async function createCandidate(args: {
  departmentId: string;
  orgStage?: string;
  stage?: string;
  finalizedAs?: string | null;
}) {
  const suffix = nextSuffix();
  return prisma.candidate.create({
    data: {
      fullName: `Candidate ${suffix}`,
      email: `candidate-${suffix}@example.com`,
      departmentId: args.departmentId,
      stage: args.stage ?? "pipeline",
      orgStage: args.orgStage ?? "active",
      finalizedAs: args.finalizedAs ?? null
    }
  });
}

async function createFinalizedMilestone(candidateId: string, status = "not_started") {
  return prisma.candidateMilestone.create({
    data: {
      candidateId,
      type: "finalized",
      title: "Finalized",
      status: status as "not_started" | "in_progress" | "done" | "failed" | "skipped",
      sortOrder: 999,
      mode: "manual"
    }
  });
}

describe("candidate finalization routes (db)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await truncateTestDatabase();
    vi.mocked(requireApiSession).mockResolvedValue({ ok: true, session: mockSession } as never);
    vi.mocked(requirePermissionForDepartment).mockResolvedValue({ ok: true } as never);
  });

  afterAll(async () => {
    await truncateTestDatabase();
    await disconnectTestDatabase();
  });

  it("hire route finalizes the candidate, syncs the milestone, and logs activity", async () => {
    const department = await createDepartment();
    const candidate = await createCandidate({ departmentId: department.id });
    await createFinalizedMilestone(candidate.id, "not_started");

    const response = await hireCandidate(
      new Request(`http://localhost/api/candidates/${candidate.id}/hire`, {
        method: "POST",
        body: JSON.stringify({ note: "Strong final review" })
      }),
      { params: Promise.resolve({ id: candidate.id }) }
    );

    expect(response.status).toBe(200);

    const updatedCandidate = await prisma.candidate.findUniqueOrThrow({ where: { id: candidate.id } });
    const updatedMilestone = await prisma.candidateMilestone.findFirstOrThrow({
      where: { candidateId: candidate.id, type: "finalized" }
    });
    const activity = await prisma.candidateActivityEvent.findFirstOrThrow({
      where: { candidateId: candidate.id, event: "hired" }
    });

    expect(updatedCandidate.stage).toBe("finalized");
    expect(updatedCandidate.orgStage).toBe("finalized");
    expect(updatedCandidate.finalizedAs).toBe("hired");
    expect(updatedMilestone.status).toBe("done");
    expect(activity.detail).toBe("Strong final review");
  });

  it("reject route finalizes the candidate, rejects active candidacies, syncs the milestone, and logs activity", async () => {
    const department = await createDepartment();
    const candidate = await createCandidate({ departmentId: department.id });
    await createFinalizedMilestone(candidate.id, "in_progress");
    await prisma.departmentCandidacy.create({
      data: {
        candidateId: candidate.id,
        departmentId: department.id,
        status: "active",
        source: "manual"
      }
    });

    const response = await rejectCandidate(
      new Request(`http://localhost/api/candidates/${candidate.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: "Did not meet final requirements" })
      }),
      { params: Promise.resolve({ id: candidate.id }) }
    );

    expect(response.status).toBe(200);

    const updatedCandidate = await prisma.candidate.findUniqueOrThrow({ where: { id: candidate.id } });
    const updatedMilestone = await prisma.candidateMilestone.findFirstOrThrow({
      where: { candidateId: candidate.id, type: "finalized" }
    });
    const candidacy = await prisma.departmentCandidacy.findUniqueOrThrow({
      where: {
        candidateId_departmentId: {
          candidateId: candidate.id,
          departmentId: department.id
        }
      }
    });
    const activity = await prisma.candidateActivityEvent.findFirstOrThrow({
      where: { candidateId: candidate.id, event: "rejected" }
    });

    expect(updatedCandidate.stage).toBe("finalized");
    expect(updatedCandidate.orgStage).toBe("finalized");
    expect(updatedCandidate.finalizedAs).toBe("rejected");
    expect(updatedCandidate.orgStatus).toBe("org_rejected");
    expect(updatedMilestone.status).toBe("done");
    expect(candidacy.status).toBe("dept_rejected");
    expect(activity.detail).toBe("Did not meet final requirements");
  });

  it("revert-finalization restores an active state and rewinds the finalized milestone", async () => {
    const department = await createDepartment();
    const candidate = await createCandidate({
      departmentId: department.id,
      orgStage: "finalized",
      stage: "finalized",
      finalizedAs: "hired"
    });
    await createFinalizedMilestone(candidate.id, "done");

    const response = await revertFinalization(
      new Request(`http://localhost/api/candidates/${candidate.id}/revert-finalization`, {
        method: "POST"
      }),
      { params: Promise.resolve({ id: candidate.id }) }
    );

    expect(response.status).toBe(200);

    const updatedCandidate = await prisma.candidate.findUniqueOrThrow({ where: { id: candidate.id } });
    const updatedMilestone = await prisma.candidateMilestone.findFirstOrThrow({
      where: { candidateId: candidate.id, type: "finalized" }
    });
    const activity = await prisma.candidateActivityEvent.findFirstOrThrow({
      where: { candidateId: candidate.id, event: "finalization_reverted" }
    });

    expect(updatedCandidate.orgStage).toBe("active");
    expect(updatedCandidate.finalizedAs).toBeNull();
    expect(updatedCandidate.stage).toBe("advanced_review");
    expect(updatedMilestone.status).toBe("not_started");
    expect(activity.detail).toBe("Reverted hired");
  });
});
