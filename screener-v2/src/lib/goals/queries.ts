import { prisma } from '@/lib/db/prisma';
import { EmployeeGoalRecord, GoalCheckInRecord, EmployeeGoalDetail } from './types';

export interface CreateGoalInput {
  employeeId: string;
  title: string;
  description?: string | null;
  category?: string;
  targetDate?: Date | null;
  createdById?: string | null;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string | null;
  category?: string;
  status?: string;
  targetDate?: Date | null;
  progress?: number;
}

export interface CreateCheckInInput {
  goalId: string;
  notes: string;
  progressSnapshot: number;
  createdById?: string | null;
}

export async function listEmployeeGoals(employeeId: string): Promise<EmployeeGoalDetail[]> {
  const goals = await prisma.employeeGoal.findMany({
    where: { employeeId },
    include: {
      checkIns: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return goals as EmployeeGoalDetail[];
}

export async function getGoalDetail(id: string): Promise<EmployeeGoalDetail | null> {
  const goal = await prisma.employeeGoal.findUnique({
    where: { id },
    include: {
      checkIns: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!goal) {
    return null;
  }

  return goal as EmployeeGoalDetail;
}

export async function createGoal(input: CreateGoalInput): Promise<EmployeeGoalRecord> {
  const goal = await prisma.employeeGoal.create({
    data: {
      employeeId: input.employeeId,
      title: input.title,
      description: input.description || null,
      category: input.category || 'performance',
      targetDate: input.targetDate || null,
      createdById: input.createdById || null,
    },
  });

  return goal as EmployeeGoalRecord;
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<EmployeeGoalRecord> {
  const updateData: any = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.targetDate !== undefined) updateData.targetDate = input.targetDate;
  if (input.progress !== undefined) updateData.progress = input.progress;

  const goal = await prisma.employeeGoal.update({
    where: { id },
    data: updateData,
  });

  return goal as EmployeeGoalRecord;
}

export async function createCheckIn(input: CreateCheckInInput): Promise<GoalCheckInRecord> {
  const checkIn = await prisma.goalCheckIn.create({
    data: {
      goalId: input.goalId,
      notes: input.notes,
      progressSnapshot: input.progressSnapshot,
      createdById: input.createdById || null,
    },
  });

  return checkIn as GoalCheckInRecord;
}

export async function deleteGoal(id: string): Promise<void> {
  await prisma.employeeGoal.delete({ where: { id } });
}
