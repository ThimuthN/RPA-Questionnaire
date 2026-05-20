import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiSession, requirePermissionForDepartment } from '@/lib/auth/guards';
import { createRequestLogContext, logRouteError } from '@/lib/server/logger';
import { prisma } from '@/lib/db/prisma';
import { createEmployee } from '@/lib/employees/queries';

const HireSchema = z.object({
  createEmployeeRecord: z.boolean().optional().default(true),
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

    // Fetch candidate and offer with assessments
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        offer: true,
        assessments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            attempt: {
              select: {
                result: { select: { pass: true } }
              }
            }
          }
        }
      },
    });

    if (!candidate) {
      return NextResponse.json({ ok: false, message: 'Candidate not found' }, { status: 404 });
    }

    const scopedPermission = await requirePermissionForDepartment(auth.session, 'hire_candidate', candidate.departmentId);
    if (!scopedPermission.ok) return scopedPermission.response;

    // Validation: Candidate must be in finalized stage
    if (candidate.stage !== 'finalized') {
      return NextResponse.json(
        { ok: false, message: 'Candidate must be in finalized stage before hiring' },
        { status: 400 }
      );
    }

    // Validation: Offer must exist and be accepted
    if (!candidate.offer || candidate.offer.status !== 'accepted') {
      return NextResponse.json(
        { ok: false, message: 'Offer must be in accepted status before hiring' },
        { status: 400 }
      );
    }

    // Validation: Must have a passed assessment
    const passedAssessment = candidate.assessments.find((a) => a.attempt?.result?.pass === true);
    if (!passedAssessment) {
      return NextResponse.json(
        { ok: false, message: 'Candidate must have a passed assessment before hiring' },
        { status: 400 }
      );
    }

    // Create employee record if requested
    let newEmployee = null;
    if (parsed.data.createEmployeeRecord) {
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
        startDate: candidate.offer.targetStartDate || new Date(),
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
      },
    });

    // Log activity
    await prisma.candidateActivityEvent.create({
      data: {
        candidateId: id,
        actorId: auth.session.userId,
        actorName: auth.session.name || auth.session.email || 'System',
        event: 'hired',
        detail: newEmployee ? `Hired as ${newEmployee.employeeNumber}` : 'Hired',
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
