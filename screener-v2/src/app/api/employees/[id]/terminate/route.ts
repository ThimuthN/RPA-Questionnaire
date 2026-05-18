import { NextRequest, NextResponse } from 'next/server';
import { requireApiSession } from '@/lib/auth/guards';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';
import { terminateEmployee } from '@/lib/employees/queries';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = createRequestLogContext(request, 'api.employees.terminate');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const employee = await terminateEmployee(id);

    return NextResponse.json({ ok: true, employee });
  } catch (error) {
    logRouteError('employees_terminate', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}
