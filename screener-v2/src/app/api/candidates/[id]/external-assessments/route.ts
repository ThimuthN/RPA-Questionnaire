import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { createCandidateExternalAssessment } from "@/lib/db/candidates";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  sourceLabel: z.string().max(120).optional(),
  status: z.enum(["completed", "passed", "failed", "needs_review", "pending"]).default("completed"),
  scorePercent: z.number().min(0).max(100).optional(),
  scoreLabel: z.string().max(80).optional(),
  summary: z.string().max(2000).optional(),
  completedAt: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional())
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;

  const permission = await requireCandidatePermission(auth.session, id, "manage_candidates");
  if (!permission.ok) return permission.response;

  try {
    const body = createSchema.parse(await request.json());
    const record = await createCandidateExternalAssessment({
      candidateId: id,
      title: body.title,
      sourceLabel: body.sourceLabel,
      status: body.status,
      scorePercent: body.scorePercent,
      scoreLabel: body.scoreLabel,
      summary: body.summary,
      completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
      recordedById: auth.session.userId ?? undefined
    });
    return NextResponse.json({ id: record.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    console.error("[external-assessments] POST error", err);
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 });
  }
}
