import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApiSession, getApiSession } from "@/lib/auth/guards";
import { isFormRequest } from "@/lib/http/request";
import { updateAppUser, deactivateAppUser, reactivateAppUser } from "@/lib/auth/app-auth";

const updateUserSchema = z.object({
  action: z.enum(["update", "deactivate", "reactivate"]).default("update"),
  name: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["admin", "recruiter", "hiring_manager", "interviewer"]).optional(),
  isInterviewer: z.boolean().optional(),
  isActive: z.boolean().optional()
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const session = await getApiSession();

  try {
    const rawBody = isFormRequest(request)
      ? Object.fromEntries((await request.formData()).entries())
      : await request.json();
    const body = updateUserSchema.parse(rawBody);

    if (body.action === "deactivate") {
      if (session?.userId === id) {
        throw new Error("Cannot deactivate your own account.");
      }
      await deactivateAppUser(id);
    } else if (body.action === "reactivate") {
      await reactivateAppUser(id);
    } else {
      await updateAppUser({
        userId: id,
        name: body.name,
        title: body.title,
        department: body.department,
        phone: body.phone,
        role: body.role,
        isInterviewer: body.isInterviewer,
        isActive: body.isActive
      });
    }

    if (isFormRequest(request)) {
      const url = new URL("/users", request.url);
      url.searchParams.set("updated", id);
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json({ ok: true });
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
