import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession, requireAdminApiSession } from "@/lib/auth/guards";
import { isFormRequest } from "@/lib/http/request";
import {
  deleteDepartment,
  getDepartment,
  updateDepartment
} from "@/lib/db/departments";

const updateSchema = z.object({
  action: z.enum(["update", "deactivate", "activate"]).default("update"),
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional()
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const dept = await getDepartment(id);

    if (!dept) {
      return NextResponse.json(
        { ok: false, message: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(dept);
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Failed to get department" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;

  try {
    const rawBody = isFormRequest(request)
      ? Object.fromEntries((await request.formData()).entries())
      : await request.json();
    const body = updateSchema.parse(rawBody);

    if (body.action === "deactivate") {
      await updateDepartment(id, { isActive: false });
    } else if (body.action === "activate") {
      await updateDepartment(id, { isActive: true });
    } else {
      await updateDepartment(id, {
        name: body.name,
        isActive: body.isActive,
        sortOrder: body.sortOrder
      });
    }

    if (isFormRequest(request)) {
      const url = new URL("/departments", request.url);
      url.searchParams.set("updated", id);
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update department.";
    if (isFormRequest(request)) {
      const url = new URL("/departments", request.url);
      url.searchParams.set("error", message);
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json(
      { ok: false, message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const { id } = await params;
    await deleteDepartment(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Failed to delete department" },
      { status: 500 }
    );
  }
}
