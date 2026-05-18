import { prisma } from '@/lib/db/prisma';
import { PerformanceReviewRecord, PerformanceReviewDetail } from './types';

export interface CreateReviewInput {
  employeeId: string;
  reviewerId: string;
  period: string;
  type?: string;
  status?: string;
}

export interface UpdateReviewInput {
  overallRating?: number | null;
  strengths?: string | null;
  improvements?: string | null;
  nextPeriodFocus?: string | null;
  status?: string;
  employeeAcknowledgedAt?: Date | null;
}

export async function listEmployeeReviews(employeeId: string): Promise<PerformanceReviewRecord[]> {
  const reviews = await prisma.performanceReview.findMany({
    where: { employeeId },
    orderBy: { createdAt: 'desc' },
  });

  return reviews as PerformanceReviewRecord[];
}

export async function getReviewDetail(id: string): Promise<PerformanceReviewDetail | null> {
  const review = await prisma.performanceReview.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!review) {
    return null;
  }

  const { employee, ...rest } = review as any;

  return {
    ...rest,
    reviewer: employee ? { id: employee.id, name: employee.fullName, email: employee.email } : undefined,
  } as PerformanceReviewDetail;
}

export async function createReview(input: CreateReviewInput): Promise<PerformanceReviewRecord> {
  const review = await prisma.performanceReview.create({
    data: {
      employeeId: input.employeeId,
      reviewerId: input.reviewerId,
      period: input.period,
      type: input.type || 'annual',
      status: input.status || 'draft',
    },
  });

  return review as PerformanceReviewRecord;
}

export async function updateReview(id: string, input: UpdateReviewInput): Promise<PerformanceReviewRecord> {
  const updateData: any = {};

  if (input.overallRating !== undefined) updateData.overallRating = input.overallRating;
  if (input.strengths !== undefined) updateData.strengths = input.strengths;
  if (input.improvements !== undefined) updateData.improvements = input.improvements;
  if (input.nextPeriodFocus !== undefined) updateData.nextPeriodFocus = input.nextPeriodFocus;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.employeeAcknowledgedAt !== undefined) updateData.employeeAcknowledgedAt = input.employeeAcknowledgedAt;

  const review = await prisma.performanceReview.update({
    where: { id },
    data: updateData,
  });

  return review as PerformanceReviewRecord;
}

export async function deleteReview(id: string): Promise<void> {
  await prisma.performanceReview.delete({ where: { id } });
}
