import { Prisma } from "@prisma/client";
import crypto from "node:crypto";
import type { ResultSummary, RoleId, StackId } from "@/lib/assessment-engine/types";
import { buildResultSummary } from "@/lib/assessment-engine/scoring";
import { buildSelection } from "@/lib/assessment-engine/selection";
import { questionBank } from "@/lib/data/question-bank";
import { prisma } from "@/lib/db/prisma";
import {
  createSectionState,
  getDefaultSelectedSections,
  normalizeSelectedSections,
  orderedSections,
  sectionRegistry
} from "@/lib/sections/registry";
import type { SectionId, SectionState } from "@/lib/sections/types";
import { hashValue, randomPasscode, randomToken } from "@/lib/tokens/token-service";

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
  sections: SectionId[];
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
  sections: SectionId[];
  sectionState: Partial<Record<SectionId, SectionState>>;
  seed: number;
  stage: SectionId | "submitted";
  status: "in_progress" | "submitted";
  coreQuestionIds: string[];
  coreAnswers: Record<string, unknown>;
  practicalAnswer: Record<string, unknown>;
  logicReasoningAnswer?: Record<string, unknown>;
  practicalEarned: number;
  practicalPossible: number;
  logicReasoningEarned: number;
  logicReasoningPossible: number;
  remainingCoreSeconds: number;
  remainingPracticalSeconds: number;
  remainingLogicReasoningSeconds?: number;
  integrity: { tabHiddenCount: number; copyCount: number; pasteCount: number };
  startedAt: string;
  submittedAt?: string;
}

interface PersistedBreakdown {
  sections: SectionId[];
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

function toSections(value: Prisma.JsonValue | null | undefined): SectionId[] {
  if (Array.isArray(value)) {
    return normalizeSelectedSections(value as SectionId[]);
  }
  return getDefaultSelectedSections();
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

function normalizeStage(stage: string, sections: SectionId[], status: string): SectionId | "submitted" {
  if (status === "submitted") return "submitted";
  if (stage && sections.includes(stage as SectionId)) {
    return stage as SectionId;
  }
  return sections[0] ?? "core";
}

function ensureSectionState(args: {
  roleId: RoleId;
  stacks: StackId[];
  sections: SectionId[];
  stored: Partial<Record<SectionId, SectionState>>;
  legacy: {
    coreAnswers: Record<string, unknown>;
    practicalAnswer: Record<string, unknown>;
    logicAnswer: Record<string, unknown>;
    remainingCoreSeconds: number;
    remainingPracticalSeconds: number;
    remainingLogicReasoningSeconds: number | null;
    practicalEarned: number;
    practicalPossible: number;
    logicReasoningEarned: number;
    logicReasoningPossible: number;
  };
}): Partial<Record<SectionId, SectionState>> {
  const baseline = createSectionState({
    roleId: args.roleId,
    stacks: args.stacks,
    sections: args.sections
  });

  for (const sectionId of args.sections) {
    const existing = args.stored[sectionId];
    const fallback = baseline[sectionId] ?? { answers: {}, remainingSeconds: 0 };

    if (sectionId === "core") {
      baseline.core = {
        answers: { ...args.legacy.coreAnswers, ...(existing?.answers ?? {}) },
        remainingSeconds:
          existing?.remainingSeconds ?? args.legacy.remainingCoreSeconds ?? fallback.remainingSeconds
      };
      continue;
    }

    if (sectionId === "practical") {
      baseline.practical = {
        answers: { ...args.legacy.practicalAnswer, ...(existing?.answers ?? {}) },
        remainingSeconds:
          existing?.remainingSeconds ?? args.legacy.remainingPracticalSeconds ?? fallback.remainingSeconds,
        earned:
          typeof existing?.earned === "number"
            ? existing.earned
            : args.legacy.practicalEarned > 0
              ? args.legacy.practicalEarned
              : undefined,
        possible:
          typeof existing?.possible === "number"
            ? existing.possible
            : args.legacy.practicalPossible > 0
              ? args.legacy.practicalPossible
              : undefined
      };
      continue;
    }

    if (sectionId === "applied_logic_reasoning") {
      baseline.applied_logic_reasoning = {
        answers: { ...args.legacy.logicAnswer, ...(existing?.answers ?? {}) },
        remainingSeconds:
          existing?.remainingSeconds ??
          args.legacy.remainingLogicReasoningSeconds ??
          fallback.remainingSeconds,
        earned:
          typeof existing?.earned === "number"
            ? existing.earned
            : args.legacy.logicReasoningEarned > 0
              ? args.legacy.logicReasoningEarned
              : undefined,
        possible:
          typeof existing?.possible === "number"
            ? existing.possible
            : args.legacy.logicReasoningPossible > 0
              ? args.legacy.logicReasoningPossible
              : undefined
      };
    }
  }

  return baseline;
}

function splitSectionState(sectionState: Partial<Record<SectionId, SectionState>>) {
  return {
    coreAnswers: sectionState.core?.answers ?? {},
    practicalAnswer: sectionState.practical?.answers ?? {},
    logicReasoningAnswer: sectionState.applied_logic_reasoning?.answers ?? {},
    remainingCoreSeconds: sectionState.core?.remainingSeconds ?? 0,
    remainingPracticalSeconds: sectionState.practical?.remainingSeconds ?? 0,
    remainingLogicReasoningSeconds: sectionState.applied_logic_reasoning?.remainingSeconds ?? null,
    practicalEarned: sectionState.practical?.earned ?? 0,
    practicalPossible: sectionState.practical?.possible ?? 0,
    logicReasoningEarned: sectionState.applied_logic_reasoning?.earned ?? 0,
    logicReasoningPossible: sectionState.applied_logic_reasoning?.possible ?? 0
  };
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
  sectionsJson: Prisma.JsonValue | null;
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
    sections: toSections(row.sectionsJson),
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
  sectionsJson: Prisma.JsonValue | null;
  sectionStateJson: Prisma.JsonValue | null;
  seed: number;
  stage: string;
  status: string;
  coreQuestionIdsJson: Prisma.JsonValue;
  coreAnswersJson: Prisma.JsonValue;
  practicalAnswerJson: Prisma.JsonValue;
  practicalEarned: number;
  practicalPossible: number;
  logicReasoningAnswerJson: Prisma.JsonValue | null;
  logicReasoningEarned: number;
  logicReasoningPossible: number;
  remainingCoreSeconds: number;
  remainingPracticalSeconds: number;
  remainingLogicReasoningSeconds: number | null;
  integrityJson: Prisma.JsonValue;
  startedAt: Date;
  submittedAt: Date | null;
}): AttemptRecord {
  const roleId = row.roleId as RoleId;
  const stacks = toStacks(row.stacksJson);
  const sections = toSections(row.sectionsJson);
  const storedSectionState = toObject<Partial<Record<SectionId, SectionState>>>(row.sectionStateJson, {});
  const sectionState = ensureSectionState({
    roleId,
    stacks,
    sections,
    stored: storedSectionState,
    legacy: {
      coreAnswers: toObject<Record<string, unknown>>(row.coreAnswersJson, {}),
      practicalAnswer: toObject<Record<string, unknown>>(row.practicalAnswerJson, {}),
      logicAnswer: toObject<Record<string, unknown>>(row.logicReasoningAnswerJson, {}),
      remainingCoreSeconds: row.remainingCoreSeconds,
      remainingPracticalSeconds: row.remainingPracticalSeconds,
      remainingLogicReasoningSeconds: row.remainingLogicReasoningSeconds,
      practicalEarned: row.practicalEarned,
      practicalPossible: row.practicalPossible,
      logicReasoningEarned: row.logicReasoningEarned,
      logicReasoningPossible: row.logicReasoningPossible
    }
  });

  const split = splitSectionState(sectionState);

  return {
    id: row.id,
    assessmentVersionId: row.assessmentVersionId,
    inviteId: row.inviteId ?? undefined,
    participantId: row.participantId,
    roleId,
    stacks,
    sections,
    sectionState,
    seed: row.seed,
    stage: normalizeStage(row.stage, sections, row.status),
    status: row.status as AttemptRecord["status"],
    coreQuestionIds: toStringArray(row.coreQuestionIdsJson),
    coreAnswers: split.coreAnswers,
    practicalAnswer: split.practicalAnswer,
    logicReasoningAnswer: split.logicReasoningAnswer,
    practicalEarned: split.practicalEarned,
    practicalPossible: split.practicalPossible,
    logicReasoningEarned: split.logicReasoningEarned,
    logicReasoningPossible: split.logicReasoningPossible,
    remainingCoreSeconds: split.remainingCoreSeconds,
    remainingPracticalSeconds: split.remainingPracticalSeconds,
    remainingLogicReasoningSeconds: split.remainingLogicReasoningSeconds ?? undefined,
    integrity: toObject<AttemptRecord["integrity"]>(row.integrityJson, {
      tabHiddenCount: 0,
      copyCount: 0,
      pasteCount: 0
    }),
    startedAt: row.startedAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString()
  };
}

function normalizeBreakdown(
  raw: ResultSummary["sectionBreakdown"] | Record<string, any>
): ResultSummary["sectionBreakdown"] {
  const normalized: ResultSummary["sectionBreakdown"] = {};
  for (const section of orderedSections) {
    const row = (raw as Record<string, any>)[section.id];
    if (!row) continue;
    normalized[section.id] = {
      label: typeof row.label === "string" ? row.label : section.label,
      pointsEarned: Number(row.pointsEarned ?? 0),
      pointsPossible: Number(row.pointsPossible ?? 0),
      percent: Number(row.percent ?? 0)
    };
  }
  return normalized;
}

function parseBreakdown(
  value: Prisma.JsonValue | null | undefined,
  attempt: AttemptRecord | null
): PersistedBreakdown {
  const fallbackSections = attempt?.sections ?? getDefaultSelectedSections();
  const parsed = toObject<Record<string, unknown>>(value, {});
  const rawSections = Array.isArray(parsed.sections) ? (parsed.sections as SectionId[]) : fallbackSections;
  const sections = normalizeSelectedSections(rawSections);
  const rawSectionBreakdown = toObject<Record<string, unknown>>(parsed.sectionBreakdown as Prisma.JsonValue, {});

  return {
    sections,
    passPercent: Number(parsed.passPercent ?? 0),
    practicalMinPercent: Number(parsed.practicalMinPercent ?? 0),
    sectionBreakdown: normalizeBreakdown(rawSectionBreakdown),
    breakdownByCategory: toObject<ResultSummary["breakdownByCategory"]>(
      parsed.breakdownByCategory as Prisma.JsonValue,
      {}
    )
  };
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
  const breakdown = parseBreakdown(resultRow.breakdownJson, attempt);
  const corePercent = breakdown.sectionBreakdown.core?.percent ?? resultRow.corePercent;
  const practicalPercent = breakdown.sectionBreakdown.practical?.percent ?? resultRow.practicalPercent;

  return {
    attemptId: resultRow.attemptId,
    roleId: attempt.roleId,
    stacks: attempt.stacks,
    sections: breakdown.sections,
    corePercent,
    practicalPercent,
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
  sections?: SectionId[];
  maxAttempts?: number;
  expiresAt?: string;
  withPasscode?: boolean;
}) {
  const token = randomToken(24);
  const passcode = input.withPasscode ? randomPasscode() : undefined;
  const selectedSections = normalizeSelectedSections(input.sections);

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
      sectionsJson: toJsonValue(selectedSections),
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
  sections?: SectionId[];
}) {
  const selectedSections = normalizeSelectedSections(input.sections);
  const selectionSeed = Math.floor(Math.random() * 0x7fffffff);
  const selection = buildSelection(input.roleId, input.stacks, selectionSeed, questionBank);
  const sectionState = createSectionState({
    roleId: input.roleId,
    stacks: input.stacks,
    sections: selectedSections
  });
  const split = splitSectionState(sectionState);
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
        sectionsJson: toJsonValue(selectedSections),
        sectionStateJson: toJsonValue(sectionState),
        seed: selection.seed,
        stage: selectedSections[0] ?? "core",
        status: "in_progress",
        coreQuestionIdsJson: toJsonValue(selectedSections.includes("core") ? selection.selectedIds : []),
        coreAnswersJson: toJsonValue(split.coreAnswers),
        practicalAnswerJson: toJsonValue(split.practicalAnswer),
        practicalEarned: 0,
        practicalPossible: 0,
        logicReasoningAnswerJson: selectedSections.includes("applied_logic_reasoning")
          ? toJsonValue(split.logicReasoningAnswer)
          : Prisma.JsonNull,
        logicReasoningEarned: 0,
        logicReasoningPossible: 0,
        remainingCoreSeconds: split.remainingCoreSeconds,
        remainingPracticalSeconds: split.remainingPracticalSeconds,
        remainingLogicReasoningSeconds: split.remainingLogicReasoningSeconds,
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
    Pick<AttemptRecord, "stage"> & {
      integrity: Partial<AttemptRecord["integrity"]>;
      sectionState: Partial<Record<SectionId, SectionState>>;
    }
  >
) {
  const currentRow = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!currentRow) return null;

  const current = mapAttempt(currentRow);
  if (current.status === "submitted") return null;

  const mergedSectionState: Partial<Record<SectionId, SectionState>> = {
    ...current.sectionState
  };

  if (patch.sectionState) {
    for (const sectionId of current.sections) {
      const incoming = patch.sectionState[sectionId];
      if (!incoming) continue;
      const existing = mergedSectionState[sectionId] ?? { answers: {}, remainingSeconds: 0 };
      mergedSectionState[sectionId] = {
        answers: { ...(existing.answers ?? {}), ...(incoming.answers ?? {}) },
        remainingSeconds:
          typeof incoming.remainingSeconds === "number"
            ? incoming.remainingSeconds
            : existing.remainingSeconds,
        earned: typeof incoming.earned === "number" ? incoming.earned : existing.earned,
        possible: typeof incoming.possible === "number" ? incoming.possible : existing.possible
      };
    }
  }

  const split = splitSectionState(mergedSectionState);
  const nextStage =
    patch.stage && (patch.stage === "submitted" || current.sections.includes(patch.stage))
      ? patch.stage
      : current.stage;

  const updated = await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      stage: nextStage,
      sectionStateJson: toJsonValue(mergedSectionState),
      coreAnswersJson: toJsonValue(split.coreAnswers),
      practicalAnswerJson: toJsonValue(split.practicalAnswer),
      logicReasoningAnswerJson: current.sections.includes("applied_logic_reasoning")
        ? toJsonValue(split.logicReasoningAnswer)
        : Prisma.JsonNull,
      remainingCoreSeconds: split.remainingCoreSeconds,
      remainingPracticalSeconds: split.remainingPracticalSeconds,
      remainingLogicReasoningSeconds: split.remainingLogicReasoningSeconds,
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

export async function submitAttempt(input: { attemptId: string }) {
  const currentRow = await prisma.attempt.findUnique({ where: { id: input.attemptId } });
  if (!currentRow) return null;

  const current = mapAttempt(currentRow);
  if (current.status === "submitted") return null;

  const result = buildResultSummary({
    attemptId: current.id,
    roleId: current.roleId,
    stacks: current.stacks,
    sections: current.sections,
    coreQuestionIds: current.coreQuestionIds,
    sectionState: current.sectionState
  });

  const submittedSectionState: Partial<Record<SectionId, SectionState>> = {
    ...current.sectionState
  };

  for (const sectionId of result.sections) {
    const sectionResult = result.sectionBreakdown[sectionId];
    if (!sectionResult) continue;
    const existing = submittedSectionState[sectionId] ?? { answers: {}, remainingSeconds: 0 };
    submittedSectionState[sectionId] = {
      ...existing,
      earned: sectionResult.pointsEarned,
      possible: sectionResult.pointsPossible
    };
  }

  const split = splitSectionState(submittedSectionState);

  await prisma.$transaction(async (tx) => {
    await tx.attempt.update({
      where: { id: input.attemptId },
      data: {
        status: "submitted",
        stage: "submitted",
        sectionStateJson: toJsonValue(submittedSectionState),
        practicalEarned: split.practicalEarned,
        practicalPossible: split.practicalPossible,
        logicReasoningEarned: split.logicReasoningEarned,
        logicReasoningPossible: split.logicReasoningPossible,
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
          sections: result.sections,
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
          sections: result.sections,
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
