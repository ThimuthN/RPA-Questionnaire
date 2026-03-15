import { Prisma } from "@prisma/client";
import crypto from "node:crypto";
import type { ResultSummary, RoleId, StackId } from "@/lib/assessment-engine/types";
import { buildSelection } from "@/lib/assessment-engine/selection";
import { buildResultSummary } from "@/lib/assessment-engine/scoring";
import { questionBank } from "@/lib/data/question-bank";
import { prisma } from "@/lib/db/prisma";
import { pickPracticalPack } from "@/features/practical/packs";
import { buildPracticalQuestion, scorePracticalQuestion } from "@/features/practical/grading";
import { hashValue, nowIso, randomPasscode, randomToken } from "@/lib/tokens/token-service";

interface InviteRecord {
  id: string;
  assessmentVersionId: string;
  mode: "candidate" | "employee" | "live";
  slug: string;
  tokenHash: string;
  passcodeHash?: string;
  roleLocked: boolean;
  stackLocked: boolean;
  roleId?: RoleId;
  stacks?: StackId[];
  maxAttempts: number;
  usedAttempts: number;
  expiresAt?: string;
  createdAt: string;
}

interface ParticipantRecord {
  id: string;
  kind: "candidate" | "employee";
  fullName: string;
  email: string;
  phone?: string;
  createdAt: string;
}

interface AttemptRecord {
  id: string;
  assessmentVersionId: string;
  inviteId?: string;
  participantId: string;
  roleId: RoleId;
  stacks: StackId[];
  seed: number;
  stage: "core" | "practical" | "submitted";
  status: "in_progress" | "submitted";
  coreQuestionIds: string[];
  coreAnswers: Record<string, unknown>;
  practicalAnswer: Record<string, unknown>;
  practicalEarned: number;
  practicalPossible: number;
  remainingCoreSeconds: number;
  remainingPracticalSeconds: number;
  integrity: { tabHiddenCount: number; copyCount: number; pasteCount: number };
  startedAt: string;
  submittedAt?: string;
}

interface PersistedBreakdown {
  passPercent: number;
  practicalMinPercent: number;
  sectionBreakdown: ResultSummary["sectionBreakdown"];
  breakdownByCategory: ResultSummary["breakdownByCategory"];
}

function cuidLike() {
  return crypto.randomUUID().replace(/-/g, "");
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function toStacks(value: Prisma.JsonValue | null | undefined): StackId[] {
  return Array.isArray(value) ? (value as StackId[]) : [];
}

function toStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function toObject<T>(value: Prisma.JsonValue | null | undefined, fallback: T): T {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
}

function mapInvite(row: {
  id: string;
  assessmentVersionId: string;
  mode: string;
  slug: string;
  tokenHash: string;
  passcodeHash: string | null;
  roleLocked: boolean;
  stackLocked: boolean;
  roleId: string | null;
  stacksJson: Prisma.JsonValue | null;
  maxAttempts: number;
  usedAttempts: number;
  expiresAt: Date | null;
  createdAt: Date;
}): InviteRecord {
  return {
    id: row.id,
    assessmentVersionId: row.assessmentVersionId,
    mode: row.mode as InviteRecord["mode"],
    slug: row.slug,
    tokenHash: row.tokenHash,
    passcodeHash: row.passcodeHash ?? undefined,
    roleLocked: row.roleLocked,
    stackLocked: row.stackLocked,
    roleId: (row.roleId as RoleId | null) ?? undefined,
    stacks: toStacks(row.stacksJson),
    maxAttempts: row.maxAttempts,
    usedAttempts: row.usedAttempts,
    expiresAt: row.expiresAt?.toISOString(),
    createdAt: row.createdAt.toISOString()
  };
}

function mapParticipant(row: {
  id: string;
  kind: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: Date;
}): ParticipantRecord {
  return {
    id: row.id,
    kind: row.kind as ParticipantRecord["kind"],
    fullName: row.fullName,
    email: row.email,
    phone: row.phone ?? undefined,
    createdAt: row.createdAt.toISOString()
  };
}

function mapAttempt(row: {
  id: string;
  assessmentVersionId: string;
  inviteId: string | null;
  participantId: string;
  roleId: string;
  stacksJson: Prisma.JsonValue;
  seed: number;
  stage: string;
  status: string;
  coreQuestionIdsJson: Prisma.JsonValue;
  coreAnswersJson: Prisma.JsonValue;
  practicalAnswerJson: Prisma.JsonValue;
  practicalEarned: number;
  practicalPossible: number;
  remainingCoreSeconds: number;
  remainingPracticalSeconds: number;
  integrityJson: Prisma.JsonValue;
  startedAt: Date;
  submittedAt: Date | null;
}): AttemptRecord {
  return {
    id: row.id,
    assessmentVersionId: row.assessmentVersionId,
    inviteId: row.inviteId ?? undefined,
    participantId: row.participantId,
    roleId: row.roleId as RoleId,
    stacks: toStacks(row.stacksJson),
    seed: row.seed,
    stage: row.stage as AttemptRecord["stage"],
    status: row.status as AttemptRecord["status"],
    coreQuestionIds: toStringArray(row.coreQuestionIdsJson),
    coreAnswers: toObject<Record<string, unknown>>(row.coreAnswersJson, {}),
    practicalAnswer: toObject<Record<string, unknown>>(row.practicalAnswerJson, {}),
    practicalEarned: row.practicalEarned,
    practicalPossible: row.practicalPossible,
    remainingCoreSeconds: row.remainingCoreSeconds,
    remainingPracticalSeconds: row.remainingPracticalSeconds,
    integrity: toObject<AttemptRecord["integrity"]>(row.integrityJson, {
      tabHiddenCount: 0,
      copyCount: 0,
      pasteCount: 0
    }),
    startedAt: row.startedAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString()
  };
}

function parseBreakdown(value: Prisma.JsonValue | null | undefined): PersistedBreakdown {
  return toObject<PersistedBreakdown>(value, {
    passPercent: 0,
    practicalMinPercent: 0,
    sectionBreakdown: {
      core: { pointsEarned: 0, pointsPossible: 0, percent: 0 },
      practical: { pointsEarned: 0, pointsPossible: 0, percent: 0 }
    },
    breakdownByCategory: {}
  });
}

function toResultSummary(
  resultRow: {
    attemptId: string;
    corePercent: number;
    practicalPercent: number;
    finalPercent: number;
    pass: boolean;
    borderline: boolean;
    breakdownJson: Prisma.JsonValue;
  },
  attempt: AttemptRecord | null
): ResultSummary | null {
  if (!attempt) return null;
  const breakdown = parseBreakdown(resultRow.breakdownJson);
  return {
    attemptId: resultRow.attemptId,
    roleId: attempt.roleId,
    stacks: attempt.stacks,
    corePercent: resultRow.corePercent,
    practicalPercent: resultRow.practicalPercent,
    finalPercent: resultRow.finalPercent,
    passPercent: breakdown.passPercent,
    practicalMinPercent: breakdown.practicalMinPercent,
    pass: resultRow.pass,
    borderline: resultRow.borderline,
    sectionBreakdown: breakdown.sectionBreakdown,
    breakdownByCategory: breakdown.breakdownByCategory
  };
}

export async function createInvite(input: {
  assessmentVersionId: string;
  mode: "candidate" | "employee" | "live";
  roleLocked?: boolean;
  stackLocked?: boolean;
  roleId?: RoleId;
  stacks?: StackId[];
  maxAttempts?: number;
  expiresAt?: string;
  withPasscode?: boolean;
}) {
  const token = randomToken(24);
  const passcode = input.withPasscode ? randomPasscode() : undefined;
  const row = await prisma.invite.create({
    data: {
      id: cuidLike(),
      assessmentVersionId: input.assessmentVersionId,
      mode: input.mode,
      slug: randomToken(6).toLowerCase(),
      tokenHash: hashValue(token),
      passcodeHash: passcode ? hashValue(passcode) : null,
      roleLocked: input.roleLocked ?? true,
      stackLocked: input.stackLocked ?? true,
      roleId: input.roleId ?? null,
      stacksJson: input.stacks?.length ? toJsonValue(input.stacks) : Prisma.JsonNull,
      maxAttempts: input.maxAttempts ?? 1,
      usedAttempts: 0,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      createdAt: new Date()
    }
  });
  return { row: mapInvite(row), token, passcode };
}

export async function validateInvite(input: {
  token?: string;
  slug?: string;
  passcode?: string;
  roleId?: RoleId;
}): Promise<{ ok: boolean; message?: string; invite?: InviteRecord; remainingAttempts?: number }> {
  const token = input.token?.trim();
  const slug = input.slug?.trim().toLowerCase();
  const row = token
    ? await prisma.invite.findUnique({ where: { tokenHash: hashValue(token) } })
    : slug
      ? await prisma.invite.findUnique({ where: { slug } })
      : null;

  if (!row) return { ok: false, message: "Invite not found." };

  const invite = mapInvite(row);
  if (invite.expiresAt && Date.parse(invite.expiresAt) < Date.now()) {
    return { ok: false, message: "Invite expired." };
  }
  if (invite.usedAttempts >= invite.maxAttempts) {
    return { ok: false, message: "Attempt limit reached." };
  }
  if (invite.passcodeHash && hashValue(String(input.passcode || "")) !== invite.passcodeHash) {
    return { ok: false, message: "Passcode invalid." };
  }
  if (invite.roleLocked && invite.roleId && input.roleId && input.roleId !== invite.roleId) {
    return { ok: false, message: "Invite is locked to a different role." };
  }

  return {
    ok: true,
    invite,
    remainingAttempts: Math.max(0, invite.maxAttempts - invite.usedAttempts)
  };
}

export async function createOrGetParticipant(input: {
  kind: "candidate" | "employee";
  fullName: string;
  email: string;
  phone?: string;
}): Promise<ParticipantRecord> {
  const normalizedEmail = input.email.toLowerCase();
  const existing = await prisma.participant.findUnique({
    where: {
      kind_email: {
        kind: input.kind,
        email: normalizedEmail
      }
    }
  });
  if (existing) return mapParticipant(existing);

  const created = await prisma.participant.create({
    data: {
      id: cuidLike(),
      kind: input.kind,
      fullName: input.fullName,
      email: normalizedEmail,
      phone: input.phone ?? null,
      createdAt: new Date()
    }
  });
  return mapParticipant(created);
}

export async function startAttempt(input: {
  inviteId?: string;
  assessmentVersionId?: string;
  participantId: string;
  roleId: RoleId;
  stacks: StackId[];
}) {
  const selectionSeed = Math.floor(Math.random() * 0x7fffffff);
  const selection = buildSelection(input.roleId, input.stacks, selectionSeed, questionBank);
  const attemptId = cuidLike();
  const startedAt = new Date();
  const attempt = await prisma.$transaction(async (tx) => {
    const created = await tx.attempt.create({
      data: {
        id: attemptId,
        assessmentVersionId: input.assessmentVersionId ?? "v1-default",
        inviteId: input.inviteId ?? null,
        participantId: input.participantId,
        roleId: input.roleId,
        stacksJson: toJsonValue(input.stacks),
        seed: selection.seed,
        stage: "core",
        status: "in_progress",
        coreQuestionIdsJson: toJsonValue(selection.selectedIds),
        coreAnswersJson: toJsonValue({}),
        practicalAnswerJson: toJsonValue({}),
        practicalEarned: 0,
        practicalPossible: 0,
        remainingCoreSeconds: 20 * 60,
        remainingPracticalSeconds: 10 * 60,
        integrityJson: toJsonValue({ tabHiddenCount: 0, copyCount: 0, pasteCount: 0 }),
        startedAt
      }
    });

    if (input.inviteId) {
      await tx.invite.update({
        where: { id: input.inviteId },
        data: { usedAttempts: { increment: 1 } }
      });
    }

    return created;
  });

  return { attempt: mapAttempt(attempt), selection };
}

export async function patchAttempt(
  attemptId: string,
  patch: Partial<
    Pick<
      AttemptRecord,
      "stage" | "coreAnswers" | "practicalAnswer" | "remainingCoreSeconds" | "remainingPracticalSeconds"
    >
  > & {
    integrity?: Partial<AttemptRecord["integrity"]>;
  }
) {
  const currentRow = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!currentRow) return null;

  const current = mapAttempt(currentRow);
  const updated = await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      stage: patch.stage ?? current.stage,
      coreAnswersJson: patch.coreAnswers
        ? toJsonValue({ ...current.coreAnswers, ...patch.coreAnswers })
        : toJsonValue(current.coreAnswers),
      practicalAnswerJson: patch.practicalAnswer
        ? toJsonValue({ ...current.practicalAnswer, ...patch.practicalAnswer })
        : toJsonValue(current.practicalAnswer),
      remainingCoreSeconds: typeof patch.remainingCoreSeconds === "number" ? patch.remainingCoreSeconds : current.remainingCoreSeconds,
      remainingPracticalSeconds:
        typeof patch.remainingPracticalSeconds === "number"
          ? patch.remainingPracticalSeconds
          : current.remainingPracticalSeconds,
      integrityJson: patch.integrity
        ? toJsonValue({
            tabHiddenCount: Number(patch.integrity.tabHiddenCount ?? current.integrity.tabHiddenCount),
            copyCount: Number(patch.integrity.copyCount ?? current.integrity.copyCount),
            pasteCount: Number(patch.integrity.pasteCount ?? current.integrity.pasteCount)
          })
        : toJsonValue(current.integrity)
    }
  });

  return mapAttempt(updated);
}

export async function submitAttempt(input: {
  attemptId: string;
}) {
  const currentRow = await prisma.attempt.findUnique({ where: { id: input.attemptId } });
  if (!currentRow) return null;

  const current = mapAttempt(currentRow);
  const practicalPack = pickPracticalPack(current.roleId, current.stacks);
  const practicalQuestion = buildPracticalQuestion(practicalPack);
  const practicalScore = scorePracticalQuestion(practicalQuestion, current.practicalAnswer);
  const practicalEarned = practicalScore.pointsEarned;
  const practicalPossible = practicalQuestion.points;
  const result = buildResultSummary({
    attemptId: current.id,
    roleId: current.roleId,
    stacks: current.stacks,
    coreQuestionIds: current.coreQuestionIds,
    coreAnswers: current.coreAnswers,
    practicalEarned,
    practicalPossible
  });

  await prisma.$transaction(async (tx) => {
    await tx.attempt.update({
      where: { id: input.attemptId },
      data: {
        status: "submitted",
        stage: "submitted",
        practicalEarned,
        practicalPossible,
        submittedAt: new Date()
      }
    });

    await tx.result.upsert({
      where: { attemptId: input.attemptId },
      update: {
        corePercent: result.corePercent,
        practicalPercent: result.practicalPercent,
        finalPercent: result.finalPercent,
        pass: result.pass,
        borderline: result.borderline,
        breakdownJson: toJsonValue({
          passPercent: result.passPercent,
          practicalMinPercent: result.practicalMinPercent,
          sectionBreakdown: result.sectionBreakdown,
          breakdownByCategory: result.breakdownByCategory
        })
      },
      create: {
        id: cuidLike(),
        attemptId: input.attemptId,
        corePercent: result.corePercent,
        practicalPercent: result.practicalPercent,
        finalPercent: result.finalPercent,
        pass: result.pass,
        borderline: result.borderline,
        breakdownJson: toJsonValue({
          passPercent: result.passPercent,
          practicalMinPercent: result.practicalMinPercent,
          sectionBreakdown: result.sectionBreakdown,
          breakdownByCategory: result.breakdownByCategory
        })
      }
    });
  });

  return result;
}

export async function listResults() {
  const resultRows = await prisma.result.findMany({
    orderBy: { finalPercent: "desc" }
  });
  const attemptIds = resultRows.map((row) => row.attemptId);
  if (attemptIds.length === 0) return [];

  const attemptRows = await prisma.attempt.findMany({
    where: { id: { in: attemptIds } }
  });
  const attemptsById = new Map(attemptRows.map((row) => [row.id, mapAttempt(row)]));

  return resultRows
    .map((row) => toResultSummary(row, attemptsById.get(row.attemptId) ?? null))
    .filter((row): row is ResultSummary => Boolean(row));
}

export async function getResult(attemptId: string) {
  const resultRow = await prisma.result.findUnique({
    where: { attemptId }
  });
  if (!resultRow) return null;

  const attemptRow = await prisma.attempt.findUnique({
    where: { id: attemptId }
  });

  return toResultSummary(resultRow, attemptRow ? mapAttempt(attemptRow) : null);
}

export async function getAttempt(attemptId: string) {
  const row = await prisma.attempt.findUnique({ where: { id: attemptId } });
  return row ? mapAttempt(row) : null;
}
