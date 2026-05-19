import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/guards";
import { candidateMilestoneTypeValues } from "@/lib/candidates/milestones";
import { prisma } from "@/lib/db/prisma";

const createMilestoneSchema = z.object({
  type: z.enum(["advanced_test", "interview"]),
  title: z.string().optional()
});

function getDefaultMilestoneTitle(type: string) {
  if (type === "advanced_test") {
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
  const auth = await requireApiSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { id: candidateId } = await params;

  try {
    const body = createMilestoneSchema.parse(await request.json());

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true }
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Find the decision milestone to determine where to insert the new milestone
    const decisionMilestone = await prisma.candidateMilestone.findFirst({
      where: { candidateId, type: "decision" },
      select: { sortOrder: true }
    });

    if (!decisionMilestone) {
      return NextResponse.json(
        { error: "Decision milestone not found" },
        { status: 500 }
      );
    }

    // Find the highest sortOrder in the advanced section (before decision)
    const lastAdvancedMilestone = await prisma.candidateMilestone.findFirst({
      where: {
        candidateId,
        sortOrder: {
          lt: decisionMilestone.sortOrder
        }
      },
      select: { sortOrder: true },
      orderBy: { sortOrder: "desc" }
    });

    // Assign sortOrder between last advanced milestone and decision
    const newSortOrder = lastAdvancedMilestone
      ? lastAdvancedMilestone.sortOrder + 1
      : 41;

    const newMilestone = await prisma.candidateMilestone.create({
      data: {
        candidateId,
        type: body.type,
        title: body.title || getDefaultMilestoneTitle(body.type),
        status: "pending",
        mode: body.type === "advanced_test" ? "platform" : "manual",
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
      { error: error instanceof Error ? error.message : "Failed to create milestone" },
      { status: 500 }
    );
  }
}
