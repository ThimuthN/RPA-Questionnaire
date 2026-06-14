import { prisma } from "@/lib/db/prisma";
import { cuidLike } from "@/lib/tokens/token-service";
import type { InterviewKitDetail, InterviewKitListItem, KitCompetencyAnchor } from "@/lib/interview-kits/types";

function mapCompetency(c: {
  id: string;
  kitId: string;
  name: string;
  description: string | null;
  anchors: unknown;
  sortOrder: number;
}) {
  return {
    id: c.id,
    kitId: c.kitId,
    name: c.name,
    description: c.description,
    anchors: (c.anchors ?? {}) as KitCompetencyAnchor,
    sortOrder: c.sortOrder,
  };
}

export async function listInterviewKits(departmentId?: string): Promise<InterviewKitListItem[]> {
  const where = departmentId
    ? { OR: [{ departmentId }, { isGlobal: true }] }
    : {};
  const rows = await prisma.interviewKit.findMany({
    where,
    orderBy: [{ isGlobal: "desc" }, { updatedAt: "desc" }],
    include: { _count: { select: { competencies: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    departmentId: r.departmentId,
    isGlobal: r.isGlobal,
    competencyCount: r._count.competencies,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getInterviewKit(id: string): Promise<InterviewKitDetail | null> {
  const row = await prisma.interviewKit.findUnique({
    where: { id },
    include: { competencies: { orderBy: { sortOrder: "asc" } } },
  });
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    departmentId: row.departmentId,
    isGlobal: row.isGlobal,
    competencies: row.competencies.map(mapCompetency),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createInterviewKit(data: {
  title: string;
  description?: string;
  departmentId?: string;
  isGlobal?: boolean;
  createdById?: string;
}): Promise<InterviewKitDetail> {
  const row = await prisma.interviewKit.create({
    data: {
      id: cuidLike(),
      title: data.title,
      description: data.description ?? null,
      departmentId: data.departmentId ?? null,
      isGlobal: data.isGlobal ?? false,
      createdById: data.createdById ?? null,
    },
    include: { competencies: true },
  });
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    departmentId: row.departmentId,
    isGlobal: row.isGlobal,
    competencies: [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function updateInterviewKit(
  id: string,
  data: { title?: string; description?: string | null; isGlobal?: boolean }
): Promise<InterviewKitDetail | null> {
  const row = await prisma.interviewKit.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.isGlobal !== undefined ? { isGlobal: data.isGlobal } : {}),
    },
    include: { competencies: { orderBy: { sortOrder: "asc" } } },
  });
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    departmentId: row.departmentId,
    isGlobal: row.isGlobal,
    competencies: row.competencies.map(mapCompetency),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function deleteInterviewKit(id: string): Promise<void> {
  await prisma.interviewKit.delete({ where: { id } });
}

export async function addCompetencyToKit(
  kitId: string,
  data: { name: string; description?: string; anchors?: KitCompetencyAnchor }
) {
  const maxOrder = await prisma.interviewKitCompetency.aggregate({
    where: { kitId },
    _max: { sortOrder: true },
  });
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;
  return prisma.interviewKitCompetency.create({
    data: {
      id: cuidLike(),
      kitId,
      name: data.name,
      description: data.description ?? null,
      anchors: data.anchors ?? {},
      sortOrder: nextOrder,
    },
  });
}

export async function updateCompetency(
  competencyId: string,
  data: { name?: string; description?: string | null; anchors?: KitCompetencyAnchor; sortOrder?: number }
) {
  return prisma.interviewKitCompetency.update({
    where: { id: competencyId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.anchors !== undefined ? { anchors: data.anchors } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
  });
}

export async function deleteCompetency(competencyId: string): Promise<void> {
  await prisma.interviewKitCompetency.delete({ where: { id: competencyId } });
}

export async function attachKitToJob(
  jobPostingId: string,
  kitId: string,
  milestoneType = "interview"
): Promise<void> {
  await prisma.jobPostingInterviewKit.upsert({
    where: { jobPostingId_kitId_milestoneType: { jobPostingId, kitId, milestoneType } },
    create: { id: cuidLike(), jobPostingId, kitId, milestoneType },
    update: {},
  });
}

export async function detachKitFromJob(attachmentId: string): Promise<void> {
  await prisma.jobPostingInterviewKit.delete({ where: { id: attachmentId } });
}

export async function getKitsForJob(jobPostingId: string) {
  return prisma.jobPostingInterviewKit.findMany({
    where: { jobPostingId },
    include: {
      kit: {
        include: { competencies: { orderBy: { sortOrder: "asc" } } },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getKitForPanel(panelId: string) {
  const panel = await prisma.interviewPanel.findUnique({
    where: { id: panelId },
    select: {
      candidateId: true,
      candidate: {
        select: {
          applications: {
            where: { status: { in: ["submitted", "under_review", "moved_to_pipeline"] } },
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: {
              jobPosting: {
                include: {
                  interviewKits: {
                    where: { milestoneType: "interview" },
                    include: {
                      kit: {
                        include: { competencies: { orderBy: { sortOrder: "asc" } } },
                      },
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const attachment = panel?.candidate.applications[0]?.jobPosting?.interviewKits[0];
  if (!attachment) return null;
  return {
    kitId: attachment.kitId,
    competencies: attachment.kit.competencies.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      anchors: (c.anchors ?? {}) as KitCompetencyAnchor,
    })),
  };
}
