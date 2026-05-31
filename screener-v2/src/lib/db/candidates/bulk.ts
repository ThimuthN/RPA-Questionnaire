import { prisma } from "@/lib/db/prisma";
import type { CandidateNoteType, CandidateStage } from "@/lib/candidates/types";
import { cuidLike } from "@/lib/tokens/token-service";

export async function bulkUpdateCandidates(input: {
  candidateIds: string[];
  action: "assign_owner" | "set_stage" | "add_note" | "set_department" | "nominate_to_dept" | "set_org_status";
  owner?: string;
  stage?: CandidateStage;
  roleId?: string;
  departmentId?: string;
  hrOwnerId?: string;
  noteBody?: string;
  noteType?: CandidateNoteType;
  nominationNote?: string;
  orgStatus?: string;
  createdById?: string;
}) {
  const candidateIds = [...new Set(input.candidateIds.filter(Boolean))];
  if (candidateIds.length === 0) {
    throw new Error("Select at least one candidate.");
  }

  if (input.action === "assign_owner") {
    const updateData: { updatedAt: Date; hrOwnerId?: string; hrOwner?: string | null } = { updatedAt: new Date() };

    if (input.hrOwnerId) {
      updateData.hrOwnerId = input.hrOwnerId;
      const user = await prisma.user.findUnique({
        where: { id: input.hrOwnerId },
        select: { name: true }
      });
      if (user) {
        updateData.hrOwner = user.name;
      }
    } else if (input.owner) {
      updateData.hrOwner = input.owner.trim();
    }

    await prisma.candidate.updateMany({
      where: { id: { in: candidateIds } },
      data: updateData
    });
    return { updatedCount: candidateIds.length };
  }

  if (input.action === "set_stage") {
    if (!input.stage) {
      throw new Error("Choose a stage.");
    }

    await prisma.candidate.updateMany({
      where: { id: { in: candidateIds } },
      data: {
        stage: input.stage,
        updatedAt: new Date()
      }
    });
    return { updatedCount: candidateIds.length };
  }

  if (input.action === "set_department") {
    if (!input.departmentId) {
      throw new Error("Select a department.");
    }

    await prisma.candidate.updateMany({
      where: { id: { in: candidateIds } },
      data: {
        departmentId: input.departmentId,
        roleId: null,
        updatedAt: new Date()
      }
    });
    return { updatedCount: candidateIds.length };
  }

  if (input.action === "nominate_to_dept") {
    if (!input.departmentId) {
      throw new Error("Select a department to nominate to.");
    }

    const { createOrUpdateDepartmentCandidacy } = await import("../candidacies");

    let count = 0;
    for (const candidateId of candidateIds) {
      await createOrUpdateDepartmentCandidacy({
        candidateId,
        departmentId: input.departmentId,
        roleId: input.roleId,
        hrOwnerId: input.hrOwnerId,
        nominatedBy: input.createdById,
        nominationNote: input.nominationNote,
        source: "nominated"
      });
      count++;
    }
    return { updatedCount: count };
  }

  if (input.action === "set_org_status") {
    if (!input.orgStatus) {
      throw new Error("Select an org status.");
    }

    const { setOrgStatus } = await import("../candidacies");

    let count = 0;
    for (const candidateId of candidateIds) {
      await setOrgStatus(candidateId, input.orgStatus as "active" | "talent_pool" | "org_rejected", input.createdById);
      count++;
    }
    return { updatedCount: count };
  }

  const noteBody = input.noteBody?.trim();
  if (!noteBody) {
    throw new Error("Add a note before saving.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.candidateNote.createMany({
      data: candidateIds.map((candidateId) => ({
        id: cuidLike(),
        candidateId,
        type: input.noteType ?? "decision",
        body: noteBody,
        createdById: input.createdById ?? null
      }))
    });

    await tx.candidate.updateMany({
      where: { id: { in: candidateIds } },
      data: {
        updatedAt: new Date()
      }
    });
  });

  return { updatedCount: candidateIds.length };
}
