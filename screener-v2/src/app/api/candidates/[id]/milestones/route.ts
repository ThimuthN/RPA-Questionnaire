import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { requireCandidatePermission } from "@/lib/auth/candidate-access";
import { prisma } from "@/lib/db/prisma";

const createMilestoneSchema = z.object({
  type: z.enum(["advanced_review", "interview"]),
  title: z.string().optional()
});

function getDefaultMilestoneTitle(type: string) {
  if (type === "advanced_review") {
    return "Additional test";
  }
  if (type === "interview") {
    return "Additional interview";
  }
  return "New milestone";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: candidateId } = await params;
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const permission = await requireCandidatePermission(auth.session, candidateId, "manage_candidates");
  if (!permission.ok) {
    return permission.response;
  }

  try {
    const body = createMilestoneSchema.parse(await request.json());

    // Find the finalized milestone to determine where to insert the new milestone
    const finalizedMilestone = await prisma.candidateMilestone.findFirst({
      where: { candidateId, type: "finalized" },
      select: { sortOrder: true }
    });

    if (!finalizedMilestone) {
      return NextResponse.json(
        { error: "Finalized milestone not found" },
        { status: 500 }
      );
    }

    // Find the highest sortOrder in the advanced section (before finalized)
    const lastAdvancedMilestone = await prisma.candidateMilestone.findFirst({
      where: {
        candidateId,
        sortOrder: {
          lt: finalizedMilestone.sortOrder
        }
      },
      select: { sortOrder: true },
      orderBy: { sortOrder: "desc" }
    });

    // Assign sortOrder between last advanced milestone and finalized
    const newSortOrder = lastAdvancedMilestone
      ? lastAdvancedMilestone.sortOrder + 1
      : 41;

    const newMilestone = await prisma.candidateMilestone.create({
      data: {
        candidateId,
        type: body.type,
        title: body.title || getDefaultMilestoneTitle(body.type),
        status: "not_started",
        mode: body.type === "advanced_review" ? "platform" : "manual",
        sortOrder: newSortOrder
      }
    });

    return NextResponse.json(newMilestone, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Could not create milestone." },
      { status: 500 }
    );
  }
}
