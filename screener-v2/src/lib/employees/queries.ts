import { prisma } from '@/lib/db/prisma';
import { EmployeeRecord, EmployeeDetail, EmployeeWorkspacePage } from './types';
import { generateEmployeeNumber } from './employee-number';

export interface ListEmployeesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: string;
  status?: string;
  employmentType?: string;
}

export async function listEmployeeWorkspacePage(params: ListEmployeesParams): Promise<EmployeeWorkspacePage> {
  const pageSize = params.pageSize || 20;
  const page = Math.max(1, params.page || 1);
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (params.search) {
    where.OR = [
      { fullName: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
      { employeeNumber: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  if (params.departmentId) {
    where.departmentId = params.departmentId;
  }

  if (params.status) {
    where.employmentStatus = params.status;
  }

  if (params.employmentType) {
    where.employmentType = params.employmentType;
  }

  const [items, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeNumber: true,
        fullName: true,
        email: true,
        phone: true,
        title: true,
        roleId: true,
        departmentId: true,
        managerId: true,
        employmentType: true,
        employmentStatus: true,
        startDate: true,
        probationEndDate: true,
        endDate: true,
        location: true,
        level: true,
        createdAt: true,
        updatedAt: true,
        candidateId: true,
      },
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip,
    }),
    prisma.employee.count({ where }),
  ]);

  return {
    items: items as EmployeeRecord[],
    total,
    page,
    pageSize,
    hasMore: skip + pageSize < total,
  };
}

export async function getEmployeeDetail(id: string): Promise<EmployeeDetail | null> {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      role: {
        select: { id: true, label: true, slug: true },
      },
      department: {
        select: { id: true, name: true, slug: true },
      },
      manager: {
        select: { id: true, fullName: true, employeeNumber: true },
      },
      candidate: {
        select: { id: true, fullName: true },
      },
    },
  });

  if (!employee) {
    return null;
  }

  const {
    role,
    department,
    manager,
    candidate,
    ...rest
  } = employee;

  return {
    ...rest,
    role: role || undefined,
    department: department || undefined,
    manager: manager || undefined,
    candidate: candidate || undefined,
  } as EmployeeDetail;
}

export interface CreateEmployeeInput {
  candidateId?: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  roleId?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  employmentType?: string;
  employmentStatus?: string;
  startDate: Date;
  probationEndDate?: Date | null;
  location?: string | null;
  level?: string | null;
}

export async function createEmployee(input: CreateEmployeeInput): Promise<EmployeeRecord> {
  const employeeNumber = await generateEmployeeNumber();

  const employee = await prisma.employee.create({
    data: {
      employeeNumber,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone || null,
      title: input.title || null,
      roleId: input.roleId || null,
      departmentId: input.departmentId || null,
      managerId: input.managerId || null,
      employmentType: input.employmentType || 'full_time',
      employmentStatus: input.employmentStatus || 'active',
      startDate: input.startDate,
      probationEndDate: input.probationEndDate || null,
      location: input.location || null,
      level: input.level || null,
      candidateId: input.candidateId || null,
    },
  });

  return employee as EmployeeRecord;
}

export interface UpdateEmployeeInput {
  fullName?: string;
  email?: string;
  phone?: string | null;
  title?: string | null;
  roleId?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  employmentType?: string;
  employmentStatus?: string;
  startDate?: Date;
  probationEndDate?: Date | null;
  endDate?: Date | null;
  location?: string | null;
  level?: string | null;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput): Promise<EmployeeRecord> {
  const updateData: any = {};

  if (input.fullName !== undefined) updateData.fullName = input.fullName;
  if (input.email !== undefined) updateData.email = input.email;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.title !== undefined) updateData.title = input.title;
  if (input.roleId !== undefined) updateData.roleId = input.roleId;
  if (input.departmentId !== undefined) updateData.departmentId = input.departmentId;
  if (input.managerId !== undefined) updateData.managerId = input.managerId;
  if (input.employmentType !== undefined) updateData.employmentType = input.employmentType;
  if (input.employmentStatus !== undefined) updateData.employmentStatus = input.employmentStatus;
  if (input.startDate !== undefined) updateData.startDate = input.startDate;
  if (input.probationEndDate !== undefined) updateData.probationEndDate = input.probationEndDate;
  if (input.endDate !== undefined) updateData.endDate = input.endDate;
  if (input.location !== undefined) updateData.location = input.location;
  if (input.level !== undefined) updateData.level = input.level;

  const employee = await prisma.employee.update({
    where: { id },
    data: updateData,
  });

  return employee as EmployeeRecord;
}

export async function terminateEmployee(id: string): Promise<EmployeeRecord> {
  const employee = await prisma.employee.update({
    where: { id },
    data: {
      employmentStatus: 'terminated',
      endDate: new Date(),
    },
  });

  return employee as EmployeeRecord;
}

export async function deleteEmployee(id: string): Promise<void> {
  await prisma.employee.delete({ where: { id } });
}
