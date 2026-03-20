import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { addCandidateResume } from "@/lib/db/candidates";
import { uploadResume } from "@/lib/storage/resumes";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const formData = await request.formData();
    const resume = formData.get("resume");
    if (!(resume instanceof File) || resume.size === 0) {
      throw new Error("Choose a resume file to upload.");
    }

    const uploaded = await uploadResume(id, resume);
    await addCandidateResume({
      candidateId: id,
      ...uploaded
    });

    const url = new URL(`/candidates/${id}`, request.url);
    url.searchParams.set("resumeUploaded", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const { id } = await params;
    const url = new URL(`/candidates/${id}`, request.url);
    url.searchParams.set("error", error instanceof Error ? error.message : "Could not upload resume.");
    return NextResponse.redirect(url, 303);
  }
}
