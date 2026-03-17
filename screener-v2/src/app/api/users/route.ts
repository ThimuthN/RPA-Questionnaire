import { NextResponse } from "next/server";
import { z } from "zod";
import { createAppUser } from "@/lib/auth/app-auth";
import { getSession } from "@/lib/auth/session";

const userSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "member"]).default("member")
});

function isFormRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, message: "Admin access required." }, { status: 403 });
  }

  try {
    const rawBody = isFormRequest(request)
      ? Object.fromEntries((await request.formData()).entries())
      : await request.json();
    const body = userSchema.parse(rawBody);
    const created = await createAppUser(body);

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
