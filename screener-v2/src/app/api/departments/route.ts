import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { createDepartment, listDepartments } from "@/lib/db/departments";

const createSchema = z.object({
  name: z.string().min(1).max(100)
});

export async function GET() {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const departments = await listDepartments(false);
    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list departments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  // Admin-only
  if (auth.session.accessLevel !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);
    const dept = await createDepartment({ name: parsed.name });
    return NextResponse.json(dept, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create department" },
      { status: 500 }
    );
  }
}
