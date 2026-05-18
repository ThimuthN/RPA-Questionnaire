import { prisma } from '@/lib/db/prisma';

export async function generateEmployeeNumber(): Promise<string> {
  // Get the highest numeric part from existing employee numbers
  const lastEmployee = await prisma.employee.findFirst({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      employeeNumber: true,
    },
  });

  let nextNumber = 1;
  if (lastEmployee?.employeeNumber) {
    const match = lastEmployee.employeeNumber.match(/EMP-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `EMP-${String(nextNumber).padStart(4, '0')}`;
}
