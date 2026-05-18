export enum EmploymentType {
  FullTime = 'full_time',
  PartTime = 'part_time',
  Contractor = 'contractor',
  Intern = 'intern',
}

export enum EmploymentStatus {
  Active = 'active',
  OnLeave = 'on_leave',
  Terminated = 'terminated',
}

export interface EmployeeRecord {
  id: string;
  candidateId: string | null;
  employeeNumber: string;
  fullName: string;
  email: string;
  phone: string | null;
  title: string | null;
  roleId: string | null;
  departmentId: string | null;
  managerId: string | null;
  employmentType: string;
  employmentStatus: string;
  startDate: Date;
  probationEndDate: Date | null;
  endDate: Date | null;
  location: string | null;
  level: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeDetail extends EmployeeRecord {
  role?: {
    id: string;
    label: string;
    slug: string;
  } | null;
  department?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  manager?: {
    id: string;
    fullName: string;
    employeeNumber: string;
  } | null;
  candidate?: {
    id: string;
    fullName: string;
  } | null;
}

export interface EmployeeWorkspacePage {
  items: EmployeeRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const EmploymentTypeLabels: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contractor: 'Contractor',
  intern: 'Intern',
};

export const EmploymentStatusLabels: Record<string, string> = {
  active: 'Active',
  on_leave: 'On Leave',
  terminated: 'Terminated',
};

export const EmploymentStatusTones: Record<string, string> = {
  active: 'positive',
  on_leave: 'warning',
  terminated: 'neutral',
};
