import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { updateAppUserRole } from "@/lib/auth/app-auth";

const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "member"])
});

function isFormRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Admin access required." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const rawBody = isFormRequest(request)
      ? Object.fromEntries((await request.formData()).entries())
      : await request.json();
    const body = updateUserRoleSchema.parse(rawBody);
    const updated = await updateAppUserRole({
      userId: id,
      role: body.role
    });

    if (isFormRequest(request)) {
      const url = new URL("/users", request.url);
      url.searchParams.set("updated", updated.email);
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json({ ok: true, user: updated });
  } catch (error) {
    if (isFormRequest(request)) {
      const url = new URL("/users", request.url);
      url.searchParams.set("error", error instanceof Error ? error.message : "Could not update user.");
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not update user." },
      { status: 400 }
    );
  }
}
