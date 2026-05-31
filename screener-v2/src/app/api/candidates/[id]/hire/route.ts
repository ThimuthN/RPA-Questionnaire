import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiSession, requirePermissionForDepartment } from '@/lib/auth/guards';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';
import { prisma } from '@/lib/db/prisma';
import { createEmployee } from '@/lib/employees/queries';
import { cuidLike } from '@/lib/tokens/token-service';

const HireSchema = z.object({
  createEmployeeRecord: z.boolean().optional().default(false),
  startDate: z.string().optional(),
  note: z.string().optional()
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = createRequestLogContext(request, 'api.candidates.hire');
  try {
    const auth = await requireApiSession();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = HireSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: 'Invalid input' }, { status: 400 });
    }

    // Fetch candidate
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        roleId: true,
        departmentId: true,
        orgStage: true
      }
    });

    if (!candidate) {
      return NextResponse.json({ ok: false, message: 'Candidate not found' }, { status: 404 });
    }

    const scopedPermission = await requirePermissionForDepartment(auth.session, 'hire_candidate', candidate.departmentId);
    if (!scopedPermission.ok) return scopedPermission.response;

    // Check if already finalized (after permission check to avoid state leak)
    if (candidate.orgStage === 'finalized') {
      return NextResponse.json({ ok: false, message: 'Candidate is already finalized.' }, { status: 400 });
    }

    // Create employee record if requested
    let newEmployee = null;
    if (parsed.data.createEmployeeRecord) {
      let startDate = new Date();
      if (parsed.data.startDate) {
        const parsedDate = new Date(parsed.data.startDate);
        if (!isNaN(parsedDate.getTime())) {
          startDate = parsedDate;
        }
      }
      newEmployee = await createEmployee({
        candidateId: id,
        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone || null,
        title: null,
        roleId: candidate.roleId || null,
        departmentId: candidate.departmentId || null,
        managerId: null,
        employmentType: 'full_time',
        employmentStatus: 'active',
        startDate,
        probationEndDate: null,
        location: null,
        level: null,
      });
    }

    // Update candidate record to mark as hired
    const updated = await prisma.candidate.update({
      where: { id },
      data: {
        stage: 'finalized',
        orgStage: 'finalized',
        finalizedAs: 'hired',
        orgStatus: 'active',
        nextAction: 'none',
        updatedAt: new Date()
      },
    });

    // Log activity
    await prisma.candidateActivityEvent.create({
      data: {
        id: cuidLike(),
        candidateId: id,
        actorId: auth.session.userId,
        actorName: auth.session.name || auth.session.email || 'System',
        event: 'hired',
        detail: parsed.data.note?.trim() || 'Marked as hired',
        createdAt: new Date()
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Candidate marked as hired',
      candidate: updated,
      employee: newEmployee,
    });
  } catch (error) {
    logRouteError('candidate_hire_failed', context, error);
    return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
  }
}
