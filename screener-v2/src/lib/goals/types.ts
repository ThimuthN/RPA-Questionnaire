export enum GoalCategory {
  Performance = 'performance',
  Growth = 'growth',
  Learning = 'learning',
  Team = 'team',
}

export enum GoalStatus {
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
  OnHold = 'on_hold',
}

export interface EmployeeGoalRecord {
  id: string;
  employeeId: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  targetDate: Date | null;
  progress: number;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalCheckInRecord {
  id: string;
  goalId: string;
  notes: string;
  progressSnapshot: number;
  createdById: string | null;
  createdAt: Date;
}

export interface EmployeeGoalDetail extends EmployeeGoalRecord {
  checkIns?: GoalCheckInRecord[];
}

export const GoalCategoryLabels: Record<string, string> = {
  performance: 'Performance',
  growth: 'Growth',
  learning: 'Learning',
  team: 'Team',
};

export const GoalCategoryColors: Record<string, string> = {
  performance: 'teal',
  growth: 'blue',
  learning: 'purple',
  team: 'emerald',
};

export const GoalStatusLabels: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
  on_hold: 'On Hold',
};

export const GoalStatusTones: Record<string, string> = {
  active: 'blue',
  completed: 'emerald',
  cancelled: 'neutral',
  on_hold: 'amber',
};
