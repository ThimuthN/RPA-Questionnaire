import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/guards';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';
import { listEmployeeWorkspacePage, createEmployee, CreateEmployeeInput } from '@/lib/employees/queries';
import { z } from 'zod';

const createEmployeeSchema = z.object({
  candidateId: z.string().optional().nullable(),
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  roleId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  employmentType: z.enum(['full_time', 'part_time', 'contractor', 'intern']).optional(),
  employmentStatus: z.enum(['active', 'on_leave', 'terminated']).optional(),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d))),
  probationEndDate: z.string().optional().nullable().refine((d) => !d || !isNaN(Date.parse(d))),
  location: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const context = createRequestLogContext(request, 'api.employees.list');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const search = url.searchParams.get('search') || undefined;
    const departmentId = url.searchParams.get('departmentId') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const employmentType = url.searchParams.get('employmentType') || undefined;

    const result = await listEmployeeWorkspacePage({
      page,
      pageSize,
      search,
      departmentId,
      status,
      employmentType,
    });

    return NextResponse.json(result);
  } catch (error) {
    logRouteError('employees_list', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const context = createRequestLogContext(request, 'api.employees.create');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = createEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 });
    }

    const input: CreateEmployeeInput = {
      candidateId: parsed.data.candidateId || undefined,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone || undefined,
      title: parsed.data.title || undefined,
      roleId: parsed.data.roleId || undefined,
      departmentId: parsed.data.departmentId || undefined,
      managerId: parsed.data.managerId || undefined,
      employmentType: parsed.data.employmentType,
      employmentStatus: parsed.data.employmentStatus,
      startDate: new Date(parsed.data.startDate),
      probationEndDate: parsed.data.probationEndDate ? new Date(parsed.data.probationEndDate) : undefined,
      location: parsed.data.location || undefined,
      level: parsed.data.level || undefined,
    };

    const employee = await createEmployee(input);
    return NextResponse.json({ ok: true, employee }, { status: 201 });
  } catch (error) {
    logRouteError('employees_create', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}
