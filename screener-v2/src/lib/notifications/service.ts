import { prisma } from "@/lib/db/prisma";

function cuidLike() {
  return Math.random().toString(36).slice(2, 27);
}

export type NotificationType =
  | "candidate_stage_advanced"
  | "offer_submitted_for_approval"
  | "offer_approved"
  | "offer_rejected"
  | "interview_scheduled"
  | "assessment_completed";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  entityHref?: string;
}): Promise<void> {
  await prisma.appNotification.create({
    data: {
      id: cuidLike(),
      ...input,
    },
  });
}

export async function createNotificationForMany(
  userIds: string[],
  input: Omit<Parameters<typeof createNotification>[0], "userId">
): Promise<void> {
  if (userIds.length === 0) return;
  await prisma.appNotification.createMany({
    data: userIds.map((userId) => ({
      id: cuidLike(),
      userId,
      ...input,
    })),
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.appNotification.count({
    where: { userId, readAt: null },
  });
}

export async function listNotifications(userId: string, limit = 40) {
  return prisma.appNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      entityHref: true,
      readAt: true,
      createdAt: true,
    },
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.appNotification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markRead(notificationId: string, userId: string): Promise<void> {
  await prisma.appNotification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
}
