import { prisma } from "@/lib/db/prisma";

const TOKEN_TTL_DAYS = 7;

export async function createExternalAssessmentUploadToken(assessmentId: string, label?: string) {
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  return prisma.candidateExternalAssessmentUploadToken.create({
    data: { assessmentId, label: label ?? null, expiresAt }
  });
}

export type UploadTokenStatus = "valid" | "not_found" | "expired" | "used";

export type ResolvedUploadToken = {
  id: string;
  token: string;
  assessmentId: string;
  label: string | null;
  usedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  assessment: { id: string; candidateId: string; title: string };
};

export async function resolveUploadToken(token: string): Promise<
  | { status: "valid"; record: ResolvedUploadToken }
  | { status: Exclude<UploadTokenStatus, "valid">; record: null }
> {
  const record = await prisma.candidateExternalAssessmentUploadToken.findUnique({
    where: { token },
    include: {
      assessment: {
        select: { id: true, candidateId: true, title: true }
      }
    }
  });

  if (!record) return { status: "not_found", record: null };
  if (record.usedAt) return { status: "used", record: null };
  if (record.expiresAt < new Date()) return { status: "expired", record: null };
  return { status: "valid", record };
}

export async function markUploadTokenUsed(token: string) {
  await prisma.candidateExternalAssessmentUploadToken.update({
    where: { token },
    data: { usedAt: new Date() }
  });
}
