import { NextResponse } from "next/server";

const EMPLOYEE_MANAGEMENT_DISABLED_MESSAGE = "Employee management is outside the v1 hiring workflow.";

function employeeManagementDisabled() {
  return NextResponse.json(
    { ok: false, message: EMPLOYEE_MANAGEMENT_DISABLED_MESSAGE },
    { status: 404 }
  );
}

export async function GET() {
  return employeeManagementDisabled();
}

export async function POST() {
  return employeeManagementDisabled();
}
