import { NextResponse } from "next/server";
import { z } from "zod";
import { createAppUser } from "@/lib/auth/app-auth";
import { requireAdminApiSession } from "@/lib/auth/guards";
import { isFormRequest } from "@/lib/http/request";

const userSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
  title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  accessLevel: z.enum(["admin", "recruiter", "hiring_manager", "interviewer"]).default("recruiter"),
  isInterviewer: z.boolean().optional()
});

export async function POST(request: Request) {
  const auth = await requireAdminApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const rawBody = isFormRequest(request)
      ? Object.fromEntries((await request.formData()).entries())
      : await request.json();
    const body = userSchema.parse(rawBody);
    const created = await createAppUser({
      ...body,
      actorId: auth.session.userId,
      actorEmail: auth.session.email
    });

    if (isFormRequest(request)) {
      const url = new URL("/users", request.url);
      url.searchParams.set("created", created.email);
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json({ ok: true, user: created });
  } catch (error) {
    if (isFormRequest(request)) {
      const url = new URL("/users", request.url);
      url.searchParams.set("error", error instanceof Error ? error.message : "Could not create user.");
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not create user." },
      { status: 400 }
    );
  }
}
