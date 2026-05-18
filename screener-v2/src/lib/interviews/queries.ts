import { prisma } from '@/lib/db/prisma';
import { InterviewPanelDetail, InterviewRecommendation } from './types';
import { deriveInterviewConsensus } from './consensus';

export async function getInterviewPanelsForCandidate(candidateId: string): Promise<InterviewPanelDetail[]> {
  const panels = await prisma.interviewPanel.findMany({
    where: { candidateId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      feedbacks: {
        include: {
          interviewer: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
    orderBy: { roundNumber: 'asc' },
  });

  return panels as InterviewPanelDetail[];
}

export async function getInterviewPanelDetail(panelId: string): Promise<InterviewPanelDetail | null> {
  const panel = await prisma.interviewPanel.findUnique({
    where: { id: panelId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      feedbacks: {
        include: {
          interviewer: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  return panel as InterviewPanelDetail | null;
}

export async function createInterviewPanel(input: {
  candidateId: string;
  roundNumber: number;
  roundName: string;
  format: string;
  scheduledAt?: Date | null;
  durationMin?: number;
  milestoneId?: string | null;
  createdById?: string | null;
  memberIds?: string[];
}): Promise<InterviewPanelDetail> {
  const nextRound =
    (await prisma.interviewPanel.findFirst({
      where: { candidateId: input.candidateId },
      select: { roundNumber: true },
      orderBy: { roundNumber: 'desc' },
    })) || null;

  const roundNumber = nextRound ? nextRound.roundNumber + 1 : 1;

  const panel = await prisma.interviewPanel.create({
    data: {
      candidateId: input.candidateId,
      roundNumber,
      roundName: input.roundName,
      format: input.format,
      scheduledAt: input.scheduledAt || null,
      durationMin: input.durationMin || 60,
      milestoneId: input.milestoneId || null,
      createdById: input.createdById,
      members: input.memberIds
        ? {
            createMany: {
              data: input.memberIds.map((userId) => ({
                userId,
                role: 'interviewer',
              })),
              skipDuplicates: true,
            },
          }
        : undefined,
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      feedbacks: {
        include: {
          interviewer: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  return panel as InterviewPanelDetail;
}

export async function updateInterviewPanel(panelId: string, input: { status?: string; scheduledAt?: Date | null }) {
  const panel = await prisma.interviewPanel.update({
    where: { id: panelId },
    data: {
      status: input.status,
      scheduledAt: input.scheduledAt,
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      feedbacks: {
        include: {
          interviewer: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  return panel as InterviewPanelDetail;
}

export async function addInterviewPanelMember(
  panelId: string,
  userId: string,
  role: string = 'interviewer',
): Promise<void> {
  await prisma.interviewPanelMember.upsert({
    where: {
      panelId_userId: { panelId, userId },
    },
    update: { role },
    create: { panelId, userId, role },
  });
}

export async function removeInterviewPanelMember(panelId: string, userId: string): Promise<void> {
  await prisma.interviewPanelMember.delete({
    where: {
      panelId_userId: { panelId, userId },
    },
  });
}

export async function submitInterviewFeedback(input: {
  panelId: string;
  interviewerId: string;
  overallRating?: number | null;
  recommendation?: InterviewRecommendation | null;
  competencyJson?: Record<string, number> | null;
  strengths?: string | null;
  concerns?: string | null;
  privateNotes?: string | null;
}): Promise<void> {
  const updateData: any = {
    submittedAt: new Date(),
  };
  if (input.overallRating !== undefined) updateData.overallRating = input.overallRating;
  if (input.recommendation !== undefined) updateData.recommendation = input.recommendation;
  if (input.competencyJson !== undefined) updateData.competencyJson = input.competencyJson;
  if (input.strengths !== undefined) updateData.strengths = input.strengths;
  if (input.concerns !== undefined) updateData.concerns = input.concerns;
  if (input.privateNotes !== undefined) updateData.privateNotes = input.privateNotes;

  const createData: any = {
    panelId: input.panelId,
    interviewerId: input.interviewerId,
    submittedAt: new Date(),
  };
  if (input.overallRating !== undefined) createData.overallRating = input.overallRating;
  if (input.recommendation !== undefined) createData.recommendation = input.recommendation;
  if (input.competencyJson !== undefined) createData.competencyJson = input.competencyJson;
  if (input.strengths !== undefined) createData.strengths = input.strengths;
  if (input.concerns !== undefined) createData.concerns = input.concerns;
  if (input.privateNotes !== undefined) createData.privateNotes = input.privateNotes;

  await prisma.interviewFeedback.upsert({
    where: {
      panelId_interviewerId: { panelId: input.panelId, interviewerId: input.interviewerId },
    },
    update: updateData,
    create: createData,
  });
}

export async function getInterviewPanelWithConsensus(panelId: string) {
  const panel = await getInterviewPanelDetail(panelId);
  if (!panel) return null;

  const consensus = deriveInterviewConsensus(panel.feedbacks);
  return { ...panel, consensus };
}

export async function deleteInterviewPanel(panelId: string): Promise<void> {
  await prisma.interviewPanel.delete({
    where: { id: panelId },
  });
}
