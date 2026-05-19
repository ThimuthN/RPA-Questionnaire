import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requireAdminApiSession } from "@/lib/auth/guards";
import { isFormRequest } from "@/lib/http/request";
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
      { ok: false, message: error instanceof Error ? error.message : "Failed to list departments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const rawBody = isFormRequest(request)
      ? Object.fromEntries((await request.formData()).entries())
      : await request.json();
    const parsed = createSchema.parse(rawBody);
    const dept = await createDepartment({ name: parsed.name });

    if (isFormRequest(request)) {
      const url = new URL("/departments", request.url);
      url.searchParams.set("created", dept.name);
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json(dept, { status: 201 });
  } catch (error) {
    if (isFormRequest(request)) {
      const url = new URL("/departments", request.url);
      url.searchParams.set("error", error instanceof Error ? error.message : "Could not create department.");
      return NextResponse.redirect(url, 303);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Failed to create department" },
      { status: 500 }
    );
  }
}
