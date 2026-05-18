import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/guards';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';
import { getEmployeeDetail, updateEmployee, UpdateEmployeeInput } from '@/lib/employees/queries';
import { z } from 'zod';

const updateEmployeeSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  roleId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  employmentType: z.enum(['full_time', 'part_time', 'contractor', 'intern']).optional(),
  employmentStatus: z.enum(['active', 'on_leave', 'terminated']).optional(),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
  probationEndDate: z.string().optional().nullable().refine((d) => !d || !isNaN(Date.parse(d))),
  endDate: z.string().optional().nullable().refine((d) => !d || !isNaN(Date.parse(d))),
  location: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = createRequestLogContext(request, 'api.employees.get');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const employee = await getEmployeeDetail(id);

    if (!employee) {
      return NextResponse.json({ ok: false, message: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    logRouteError('employees_get', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = createRequestLogContext(request, 'api.employees.update');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = updateEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 });
    }

    const input: UpdateEmployeeInput = {};
    if (parsed.data.fullName !== undefined) input.fullName = parsed.data.fullName;
    if (parsed.data.email !== undefined) input.email = parsed.data.email;
    if (parsed.data.phone !== undefined) input.phone = parsed.data.phone;
    if (parsed.data.title !== undefined) input.title = parsed.data.title;
    if (parsed.data.roleId !== undefined) input.roleId = parsed.data.roleId;
    if (parsed.data.departmentId !== undefined) input.departmentId = parsed.data.departmentId;
    if (parsed.data.managerId !== undefined) input.managerId = parsed.data.managerId;
    if (parsed.data.employmentType !== undefined) input.employmentType = parsed.data.employmentType;
    if (parsed.data.employmentStatus !== undefined) input.employmentStatus = parsed.data.employmentStatus;
    if (parsed.data.startDate !== undefined) input.startDate = new Date(parsed.data.startDate);
    if (parsed.data.probationEndDate !== undefined) input.probationEndDate = parsed.data.probationEndDate ? new Date(parsed.data.probationEndDate) : null;
    if (parsed.data.endDate !== undefined) input.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null;
    if (parsed.data.location !== undefined) input.location = parsed.data.location;
    if (parsed.data.level !== undefined) input.level = parsed.data.level;

    const employee = await updateEmployee(id, input);
    return NextResponse.json({ ok: true, employee });
  } catch (error) {
    logRouteError('employees_update', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}
