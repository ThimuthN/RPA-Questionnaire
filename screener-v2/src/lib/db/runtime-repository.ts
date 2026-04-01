import { Prisma } from "@prisma/client";
import type {
  AssessmentContextType,
  ExamBlueprint,
  ExamBlueprintDraftItem,
  ExamState,
  IntegrityPresetId,
  ResultSummary,
  RoleId,
  StackId
} from "@/lib/assessment-engine/types";
import { buildResultSummary } from "@/lib/assessment-engine/scoring";
import { getQuestionsByIds, getRoleConfig } from "@/lib/data/question-bank";
import { prisma } from "@/lib/db/prisma";
import { toResultSummary } from "@/lib/db/result-projections";
import {
  createSectionState,
  getDefaultSelectedSections,
  normalizeSelectedSections
} from "@/lib/sections/registry";
import type { SectionId, SectionState } from "@/lib/sections/types";
import { cuidLike, hashValue, randomPasscode, randomToken } from "@/lib/tokens/token-service";
import {
  blueprintLegacySections,
  blueprintRoleId,
  blueprintStacks,
  normalizeExamDrafts,
  resolveExamBlueprint
} from "@/lib/exams/resolve";
import { carriesRoleContext, isCoreExamDefinition } from "@/lib/exams/catalog";
import { normalizeIntegrityPreset } from "@/lib/integrity/policy";
import {
  buildInviteValidationResult,
  type InviteValidationState
} from "@/lib/invites/validation";
import { linkCandidateAssessmentAttemptInTx } from "@/lib/db/candidate-assessment-links";
import { toObject } from "@/lib/db/db-utils";

interface InviteRecord {
  id: string;
  assessmentVersionId: string;
  mode: "candidate" | "employee" | "live";
  contextType: AssessmentContextType;
  slug: string;
  tokenHash: string;
  passcodeHash?: string;
  integrityPreset: IntegrityPresetId;
  roleLocked: boolean;
  stackLocked: boolean;
  roleId?: string;
  passTargetPercent: number;
  stacks?: StackId[];
  sections: SectionId[];
  blueprint: ExamBlueprint;
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
  contextType: AssessmentContextType;
  candidateName?: string;
  candidateEmail?: string;
  integrityPreset: IntegrityPresetId;
  roleId?: string;
  passTargetPercent: number;
  stacks: StackId[];
  sections: SectionId[];
  blueprint: ExamBlueprint;
  examState: Partial<Record<string, ExamState>>;
  sectionState: Partial<Record<SectionId, SectionState>>;
  seed: number;
  stage: string | "submitted";
  status: "in_progress" | "submitted";
  coreQuestionIds: string[];
  coreAnswers: Record<string, unknown>;
  practicalAnswer: Record<string, unknown>;
  logicReasoningAnswer?: Record<string, unknown>;
  practicalEarned: number;
  practicalPossible: number;
  logicReasoningEarned: number;
  logicReasoningPossible: number;
  stateVersion: number;
  remainingCoreSeconds: number;
  remainingPracticalSeconds: number;
  remainingLogicReasoningSeconds?: number;
  integrity: { tabHiddenCount: number; copyCount: number; pasteCount: number };
  startedAt: string;
  submittedAt?: string;
}

interface ExamStateEnvelope {
  examState: Partial<Record<string, ExamState>>;
  activeExamInstanceId?: string;
  activeExamStartedAt?: string;
  integrity?: AttemptRecord["integrity"];
  legacySectionState: Partial<Record<SectionId, SectionState>>;
}

const DEFAULT_ATTEMPT_INTEGRITY: AttemptRecord["integrity"] = {
  tabHiddenCount: 0,
  copyCount: 0,
  pasteCount: 0
};

type AttemptMutationResult =
  | { status: "updated"; attempt: AttemptRecord }
  | { status: "conflict"; attempt: AttemptRecord }
  | { status: "submitted"; attempt: AttemptRecord }
  | { status: "missing" };

type SubmitAttemptResult =
  | { status: "submitted"; attempt: AttemptRecord; result: ResultSummary }
  | { status: "conflict"; attempt: AttemptRecord }
  | { status: "missing" };

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


function buildLegacyBlueprintFromSections(args: {
  roleId: RoleId;
  stacks: StackId[];
  sections: SectionId[];
  passPercent: number;
}): ExamBlueprint {
  const drafts = normalizeExamDrafts({
    roleId: args.roleId,
    stacks: args.stacks,
    sections: args.sections,
    passPercent: args.passPercent
  });
  return resolveExamBlueprint({
    drafts,
    passPercent: args.passPercent
  });
}

function buildAttemptBlueprintFromLegacy(args: {
  roleId: RoleId;
  stacks: StackId[];
  sections: SectionId[];
  passPercent: number;
  coreQuestionIds: string[];
}): ExamBlueprint {
  const base = buildLegacyBlueprintFromSections(args);

  return {
    exams: base.exams.map((exam) => {
      if (!isCoreExamDefinition(exam.definitionId)) return exam;
      return {
        ...exam,
        contentSnapshot: {
          ...exam.contentSnapshot,
          items: getQuestionsByIds(args.coreQuestionIds)
        }
      };
    })
  };
}

function parseBlueprint(
  value: Prisma.JsonValue | null | undefined,
  fallback: ExamBlueprint
): ExamBlueprint {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Array.isArray((value as Record<string, unknown>).exams)
  ) {
    return value as unknown as ExamBlueprint;
  }
  return fallback;
}

function normalizeStage(stage: string, blueprint: ExamBlueprint, status: string): string | "submitted" {
  if (status === "submitted") return "submitted";
  const direct = blueprint.exams.find((exam) => exam.instanceId === stage);
  if (direct) return direct.instanceId;
  const legacy = blueprint.exams.find((exam) => exam.legacySectionId === stage);
  if (legacy) return legacy.instanceId;
  return blueprint.exams[0]?.instanceId ?? "submitted";
}

function resolveProgressStage(
  currentStage: string | "submitted",
  requestedStage: string | undefined,
  blueprint: ExamBlueprint
) {
  if (currentStage === "submitted" || requestedStage === "submitted") {
    return "submitted" as const;
  }
  if (!requestedStage) {
    return currentStage;
  }

  const orderByStage = new Map(blueprint.exams.map((exam) => [exam.instanceId, exam.order]));
  const currentOrder = orderByStage.get(currentStage);
  const requestedOrder = orderByStage.get(requestedStage);

  if (typeof requestedOrder !== "number") {
    return currentStage;
  }
  if (typeof currentOrder !== "number") {
    return requestedStage;
  }

  return requestedOrder >= currentOrder ? requestedStage : currentStage;
}

function createExamState(blueprint: ExamBlueprint) {
  return Object.fromEntries(
    blueprint.exams.map((exam) => [
      exam.instanceId,
      {
        answers: {},
        remainingSeconds: exam.durationMinutes * 60
      } satisfies ExamState
    ])
  ) as Partial<Record<string, ExamState>>;
}

function parseExamStateEnvelope(value: Prisma.JsonValue | null | undefined): ExamStateEnvelope {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, Prisma.JsonValue>;
    if ("examState" in record) {
      return {
        examState: toObject<Partial<Record<string, ExamState>>>(record.examState, {}),
        activeExamInstanceId:
          typeof record.activeExamInstanceId === "string" ? record.activeExamInstanceId : undefined,
        activeExamStartedAt:
          typeof record.activeExamStartedAt === "string" ? record.activeExamStartedAt : undefined,
        integrity:
          record.integrity && typeof record.integrity === "object" && !Array.isArray(record.integrity)
            ? toObject<AttemptRecord["integrity"]>(record.integrity, DEFAULT_ATTEMPT_INTEGRITY)
            : undefined,
        legacySectionState: {}
      };
    }

    const legacy = value as Partial<Record<string, ExamState>>;
    return {
      examState: legacy,
      legacySectionState: legacy as Partial<Record<SectionId, SectionState>>
    };
  }

  return {
    examState: {},
    legacySectionState: {}
  };
}

function checkpointActiveExamState(args: {
  envelope: ExamStateEnvelope;
  blueprint: ExamBlueprint;
  stage: string;
  status: string;
  now?: Date;
}) {
  if (args.status === "submitted") {
    return {
      examState: args.envelope.examState,
      activeExamInstanceId: undefined,
      activeExamStartedAt: undefined
    };
  }

  const activeStage = normalizeStage(args.stage, args.blueprint, args.status);
  if (activeStage === "submitted") {
    return {
      examState: args.envelope.examState,
      activeExamInstanceId: undefined,
      activeExamStartedAt: undefined
    };
  }

  const activeExam =
    args.blueprint.exams.find((exam) => exam.instanceId === args.envelope.activeExamInstanceId) ??
    args.blueprint.exams.find((exam) => exam.instanceId === activeStage) ??
    null;

  if (!activeExam) {
    return {
      examState: args.envelope.examState,
      activeExamInstanceId: undefined,
      activeExamStartedAt: undefined
    };
  }

  const startedAtMs = args.envelope.activeExamStartedAt ? Date.parse(args.envelope.activeExamStartedAt) : NaN;
  if (!Number.isFinite(startedAtMs)) {
    return {
      examState: args.envelope.examState,
      activeExamInstanceId: activeExam.instanceId,
      activeExamStartedAt: args.envelope.activeExamStartedAt
    };
  }

  const nowMs = (args.now ?? new Date()).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  if (elapsedSeconds <= 0) {
    return {
      examState: args.envelope.examState,
      activeExamInstanceId: activeExam.instanceId,
      activeExamStartedAt: args.envelope.activeExamStartedAt
    };
  }

  const existing =
    args.envelope.examState[activeExam.instanceId] ?? {
      answers: {},
      remainingSeconds: activeExam.durationMinutes * 60
    };

  return {
    examState: {
      ...args.envelope.examState,
      [activeExam.instanceId]: {
        ...existing,
        remainingSeconds: Math.max(0, Number(existing.remainingSeconds ?? 0) - elapsedSeconds)
      }
    },
    activeExamInstanceId: activeExam.instanceId,
    activeExamStartedAt: args.envelope.activeExamStartedAt
  };
}

function buildExamStateEnvelopeJson(args: {
  examState: Partial<Record<string, ExamState>>;
  activeExamInstanceId?: string;
  activeExamStartedAt?: string;
  integrity?: AttemptRecord["integrity"];
}) {
  return {
    examState: args.examState,
    activeExamInstanceId: args.activeExamInstanceId ?? null,
    activeExamStartedAt: args.activeExamStartedAt ?? null,
    integrity: args.integrity ?? null
  };
}

function legacySectionStateFromBlueprint(
  blueprint: ExamBlueprint,
  examState: Partial<Record<string, ExamState>>
): Partial<Record<SectionId, SectionState>> {
  const next: Partial<Record<SectionId, SectionState>> = {};
  for (const exam of blueprint.exams) {
    if (!exam.legacySectionId) continue;
    next[exam.legacySectionId] = examState[exam.instanceId] ?? {
      answers: {},
      remainingSeconds: exam.durationMinutes * 60
    };
  }
  return next;
}

function ensureExamState(args: {
  blueprint: ExamBlueprint;
  stored: Partial<Record<string, ExamState>>;
  legacy: Partial<Record<SectionId, SectionState>>;
}): Partial<Record<string, ExamState>> {
  const baseline = createExamState(args.blueprint);

  for (const exam of args.blueprint.exams) {
    const direct = args.stored[exam.instanceId];
    const legacy = exam.legacySectionId ? args.legacy[exam.legacySectionId] : undefined;
    const fallback = baseline[exam.instanceId] ?? { answers: {}, remainingSeconds: exam.durationMinutes * 60 };
    baseline[exam.instanceId] = {
      answers: { ...(legacy?.answers ?? {}), ...(direct?.answers ?? {}) },
      remainingSeconds:
        typeof direct?.remainingSeconds === "number"
          ? direct.remainingSeconds
          : typeof legacy?.remainingSeconds === "number"
            ? legacy.remainingSeconds
            : fallback.remainingSeconds,
      earned: typeof direct?.earned === "number" ? direct.earned : legacy?.earned,
      possible: typeof direct?.possible === "number" ? direct.possible : legacy?.possible
    };
  }

  return baseline;
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

function normalizePassTargetPercent(value: number | null | undefined, roleId?: RoleId): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(100, Math.max(0, Math.round(value)));
  }
  if (roleId) {
    return Number(getRoleConfig(roleId).pass_percentage ?? 60);
  }
  return 60;
}

function mapInvite(row: {
  id: string;
  assessmentVersionId: string;
  mode: string;
  contextType: string;
  slug: string;
  tokenHash: string;
  passcodeHash: string | null;
  integrityPreset: string | null;
  roleLocked: boolean;
  stackLocked: boolean;
  roleId: string | null;
  passTargetPercent: number | null;
  stacksJson: Prisma.JsonValue | null;
  sectionsJson: Prisma.JsonValue | null;
  blueprintJson: Prisma.JsonValue | null;
  maxAttempts: number;
  usedAttempts: number;
  expiresAt: Date | null;
  createdAt: Date;
}): InviteRecord {
  const roleId = (row.roleId as RoleId | null) ?? undefined;
  const stacks = toStacks(row.stacksJson);
  const sections = toSections(row.sectionsJson);
  const passTargetPercent = normalizePassTargetPercent(row.passTargetPercent, roleId);
  const blueprint = parseBlueprint(
    row.blueprintJson,
    buildLegacyBlueprintFromSections({
      roleId: roleId ?? "Associate",
      stacks: stacks.length > 0 ? stacks : ["UiPath"],
      sections,
      passPercent: passTargetPercent
    })
  );

  return {
    id: row.id,
    assessmentVersionId: row.assessmentVersionId,
    mode: row.mode as InviteRecord["mode"],
    contextType: row.contextType as AssessmentContextType,
    slug: row.slug,
      tokenHash: row.tokenHash,
      passcodeHash: row.passcodeHash ?? undefined,
      integrityPreset: normalizeIntegrityPreset(row.integrityPreset, "strict"),
      roleLocked: row.roleLocked,
      stackLocked: row.stackLocked,
      roleId: row.roleId ?? undefined,
      passTargetPercent,
      stacks: stacks.length > 0 ? stacks : blueprintStacks(blueprint, ["UiPath"]),
    sections,
    blueprint,
    maxAttempts: row.maxAttempts,
    usedAttempts: row.usedAttempts,
    expiresAt: row.expiresAt?.toISOString(),
    createdAt: row.createdAt.toISOString()
  };
}

export function mapParticipant(row: {
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

export function mapAttempt(row: {
  id: string;
  assessmentVersionId: string;
  inviteId: string | null;
  participantId: string;
  contextType: string;
  integrityPreset: string | null;
  roleId: string | null;
  passTargetPercent: number | null;
  stacksJson: Prisma.JsonValue;
  sectionsJson: Prisma.JsonValue | null;
  blueprintJson: Prisma.JsonValue | null;
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
  stateVersion: number;
  remainingCoreSeconds: number;
  remainingPracticalSeconds: number;
  remainingLogicReasoningSeconds: number | null;
  integrityJson: Prisma.JsonValue;
  startedAt: Date;
  submittedAt: Date | null;
}): AttemptRecord {
  const roleId = (row.roleId as RoleId | null) ?? undefined;
  const stacks = toStacks(row.stacksJson);
  const sections = toSections(row.sectionsJson);
  const passTargetPercent = normalizePassTargetPercent(row.passTargetPercent, roleId);
  const blueprint = parseBlueprint(
    row.blueprintJson,
    buildAttemptBlueprintFromLegacy({
      roleId: roleId ?? "Associate",
      stacks,
      sections,
      passPercent: passTargetPercent,
      coreQuestionIds: toStringArray(row.coreQuestionIdsJson)
    })
  );
  const parsedExamState = parseExamStateEnvelope(row.sectionStateJson);
  const checkpointedExamState = checkpointActiveExamState({
    envelope: parsedExamState,
    blueprint,
    stage: row.stage,
    status: row.status,
    now: new Date()
  });
  const storedSectionState = parsedExamState.legacySectionState;
  const sectionState = ensureSectionState({
    roleId: roleId ?? blueprintRoleId(blueprint, "Associate"),
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
  const examState = ensureExamState({
    blueprint,
    stored: checkpointedExamState.examState,
    legacy: sectionState
  });

  const split = splitSectionState(sectionState);
  const effectiveSections = sections.length > 0 ? sections : blueprintLegacySections(blueprint);

  return {
    id: row.id,
    assessmentVersionId: row.assessmentVersionId,
    inviteId: row.inviteId ?? undefined,
      participantId: row.participantId,
      contextType: row.contextType as AssessmentContextType,
      integrityPreset: normalizeIntegrityPreset(row.integrityPreset, "strict"),
      roleId: roleId ?? undefined,
      passTargetPercent,
    stacks,
    sections: effectiveSections,
    blueprint,
    examState,
    sectionState,
    seed: row.seed,
    stage: normalizeStage(row.stage, blueprint, row.status),
    status: row.status as AttemptRecord["status"],
    coreQuestionIds:
      blueprint.exams
        .find((exam) => carriesRoleContext(exam.definitionId))
        ?.contentSnapshot.items.map((item) => item.id) ??
      toStringArray(row.coreQuestionIdsJson),
    coreAnswers: split.coreAnswers,
    practicalAnswer: split.practicalAnswer,
    logicReasoningAnswer: split.logicReasoningAnswer,
    practicalEarned: split.practicalEarned,
    practicalPossible: split.practicalPossible,
    logicReasoningEarned: split.logicReasoningEarned,
    logicReasoningPossible: split.logicReasoningPossible,
    stateVersion: row.stateVersion,
    remainingCoreSeconds: split.remainingCoreSeconds,
    remainingPracticalSeconds: split.remainingPracticalSeconds,
    remainingLogicReasoningSeconds: split.remainingLogicReasoningSeconds ?? undefined,
    integrity:
      parsedExamState.integrity ??
      toObject<AttemptRecord["integrity"]>(row.integrityJson, {
        tabHiddenCount: 0,
        copyCount: 0,
        pasteCount: 0
      }),
    startedAt: row.startedAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString()
  };
}


export async function createInvite(input: {
  assessmentVersionId: string;
  mode: "candidate" | "employee" | "live";
  contextType?: AssessmentContextType;
  candidateId?: string;
  candidateMilestoneId?: string;
  createdById?: string;
  integrityPreset?: IntegrityPresetId;
  roleLocked?: boolean;
  stackLocked?: boolean;
  roleId?: RoleId;
  passTargetPercent?: number;
  stacks?: StackId[];
  sections?: SectionId[];
  blueprint?: { exams: ExamBlueprintDraftItem[] };
  maxAttempts?: number;
  expiresAt?: string;
  withPasscode?: boolean;
}) {
  const token = randomToken(24);
  const passcode = input.withPasscode ? randomPasscode() : undefined;
  const integrityPreset = normalizeIntegrityPreset(input.integrityPreset, "standard");
  const selectedSections = normalizeSelectedSections(input.sections);
  const passTargetPercent = normalizePassTargetPercent(input.passTargetPercent);
  const drafts = normalizeExamDrafts({
    exams: input.blueprint?.exams,
    roleId: input.roleId,
    stacks: input.stacks,
    sections: selectedSections,
    passPercent: passTargetPercent
  });
  const blueprint = resolveExamBlueprint({
    drafts,
    passPercent: passTargetPercent
  });
  const stacks = input.stacks?.length ? input.stacks : blueprintStacks(blueprint, ["UiPath"]);
  const sections = blueprintLegacySections(blueprint);

  const row = await prisma.$transaction(async (tx) => {
    if (input.candidateId) {
      const candidate = await tx.candidate.findUnique({
        where: { id: input.candidateId },
        select: { id: true }
      });
      if (!candidate) {
        throw new Error("Candidate not found.");
      }

      if (input.candidateMilestoneId) {
        const milestone = await tx.candidateMilestone.findFirst({
          where: {
            id: input.candidateMilestoneId,
            candidateId: input.candidateId
          },
          select: { id: true }
        });

        if (!milestone) {
          throw new Error("Milestone not found.");
        }
      }
    }

    const created = await tx.invite.create({
      data: {
        id: cuidLike(),
        assessmentVersionId: input.assessmentVersionId,
        mode: input.mode,
        contextType: input.contextType ?? "general",
        slug: randomToken(6).toLowerCase(),
        tokenHash: hashValue(token),
          passcodeHash: passcode ? hashValue(passcode) : null,
          integrityPreset,
          roleLocked: input.roleLocked ?? true,
          stackLocked: input.stackLocked ?? true,
          roleId: input.roleId ?? null,
          passTargetPercent,
        stacksJson: stacks.length ? toJsonValue(stacks) : Prisma.JsonNull,
        sectionsJson: toJsonValue(sections),
        blueprintJson: toJsonValue(blueprint),
        maxAttempts: input.maxAttempts ?? 1,
        usedAttempts: 0,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        createdAt: new Date()
      }
    });

    if (input.candidateId) {
      const createdAssessment = await tx.candidateAssessment.create({
        data: {
          id: cuidLike(),
          candidateId: input.candidateId,
          inviteId: created.id,
          createdById: input.createdById ?? null
        }
      });

      if (input.candidateMilestoneId) {
        await tx.candidateMilestone.update({
          where: { id: input.candidateMilestoneId },
          data: {
            candidateAssessmentId: createdAssessment.id,
            status: "in_progress",
            mode: "platform"
          }
        });
      }
    }

    return created;
  });
  return { row: mapInvite(row), token, passcode };
}

export async function validateInvite(input: {
  token?: string;
  slug?: string;
  passcode?: string;
}): Promise<{
  ok: boolean;
  state: InviteValidationState;
  message: string;
  invite?: InviteRecord;
  remainingAttempts: number;
}> {
  const token = input.token?.trim();
  const slug = input.slug?.trim().toLowerCase();
  const row = token
    ? await prisma.invite.findUnique({ where: { tokenHash: hashValue(token) } })
    : slug
      ? await prisma.invite.findUnique({ where: { slug } })
      : null;

  const invite = row ? mapInvite(row) : undefined;
  const roleMismatch = false;
  const requiresPasscode = Boolean(invite?.passcodeHash);
  const providedPasscode = String(input.passcode ?? "").trim().length > 0;
  const passcodeMatches =
    !requiresPasscode ||
    (invite?.passcodeHash ? hashValue(String(input.passcode || "")) === invite.passcodeHash : true);
  const remainingAttempts = invite ? Math.max(0, invite.maxAttempts - invite.usedAttempts) : 0;
  const validation = buildInviteValidationResult({
    exists: Boolean(invite),
    expired: Boolean(invite?.expiresAt && Date.parse(invite.expiresAt) < Date.now()),
    attemptLimitReached: Boolean(invite && invite.usedAttempts >= invite.maxAttempts),
    requiresPasscode,
    passcodeProvided: providedPasscode,
    passcodeMatches,
    roleMismatch,
    remainingAttempts
  });

  return {
    ...validation,
    invite: invite && !roleMismatch ? invite : undefined,
    remainingAttempts: validation.remainingAttempts
  };
}

export async function createOrGetParticipant(input: {
  kind: "candidate" | "employee";
  fullName: string;
  email: string;
  phone?: string;
}): Promise<ParticipantRecord> {
  const normalizedEmail = input.email.toLowerCase();
  const participant = await prisma.participant.upsert({
    where: {
      kind_email: {
        kind: input.kind,
        email: normalizedEmail
      }
    },
    update: {},
    create: {
      id: cuidLike(),
      kind: input.kind,
      fullName: input.fullName,
      email: normalizedEmail,
      phone: input.phone ?? null,
      createdAt: new Date()
    }
  });
  return mapParticipant(participant);
}

export async function startAttempt(input: {
  inviteId?: string;
  assessmentVersionId?: string;
  participantId: string;
  contextType?: AssessmentContextType;
  integrityPreset?: IntegrityPresetId;
  roleId?: RoleId;
  passTargetPercent?: number;
  stacks?: StackId[];
  sections?: SectionId[];
  blueprint?: ExamBlueprint;
  exams?: ExamBlueprintDraftItem[];
}) {
  const passTargetPercent = normalizePassTargetPercent(input.passTargetPercent);
  const integrityPreset = normalizeIntegrityPreset(input.integrityPreset, "standard");
  const selectedSections = normalizeSelectedSections(input.sections);
  const blueprint =
    input.blueprint ??
      resolveExamBlueprint({
        drafts: normalizeExamDrafts({
          exams: input.exams,
        roleId: input.roleId,
        stacks: input.stacks,
        sections: selectedSections,
        passPercent: passTargetPercent
        }),
        passPercent: passTargetPercent
      });
  const effectiveRoleId = blueprint.exams.some(
    (exam) => carriesRoleContext(exam.definitionId)
  )
    ? blueprintRoleId(blueprint, "Associate")
    : input.roleId;
  const effectiveStacks = input.stacks?.length ? input.stacks : blueprintStacks(blueprint, ["UiPath"]);
  const effectiveSections = blueprintLegacySections(blueprint);
  const examState = createExamState(blueprint);
  const sectionState = legacySectionStateFromBlueprint(blueprint, examState);
  const split = splitSectionState(sectionState);
  const attemptId = cuidLike();
  const startedAt = new Date();
  const initialIntegrity = DEFAULT_ATTEMPT_INTEGRITY;
  const coreQuestionIds =
    blueprint.exams
      .find((exam) => carriesRoleContext(exam.definitionId))
      ?.contentSnapshot.items.map((item) => item.id) ?? [];

  let attempt;
  const maxStartRetries = input.inviteId ? 2 : 1;

  for (let startRetry = 0; startRetry < maxStartRetries; startRetry += 1) {
    try {
      attempt = await prisma.$transaction(async (tx) => {
        let linkedCandidateAssessmentId: string | null = null;

        if (input.inviteId) {
          const existing = await tx.attempt.findFirst({
            where: {
              inviteId: input.inviteId,
              participantId: input.participantId,
              status: "in_progress"
            },
            orderBy: {
              startedAt: "desc"
            }
          });

          if (existing) {
            return existing;
          }

          const invite = await tx.invite.findUnique({
            where: { id: input.inviteId },
            select: {
              id: true,
              maxAttempts: true,
              usedAttempts: true
            }
          });

          if (!invite) {
            throw new Error("Invite not found.");
          }
          if (invite.usedAttempts >= invite.maxAttempts) {
            throw new Error("Invite attempt limit reached.");
          }

          const reserved = await tx.invite.updateMany({
            where: {
              id: invite.id,
              usedAttempts: invite.usedAttempts
            },
            data: {
              usedAttempts: {
                increment: 1
              }
            }
          });

          if (reserved.count !== 1) {
            throw new Error("Invite attempt reservation failed. Please retry.");
          }

          linkedCandidateAssessmentId =
            (
              await tx.candidateAssessment.findFirst({
                where: { inviteId: invite.id },
                select: { id: true }
              })
            )?.id ?? null;
        }

        const created = await tx.attempt.create({
          data: {
            id: attemptId,
            assessmentVersionId: input.assessmentVersionId ?? "v1-default",
            inviteId: input.inviteId ?? null,
              participantId: input.participantId,
              contextType: input.contextType ?? "general",
              integrityPreset,
              roleId: effectiveRoleId ?? null,
            passTargetPercent,
            stacksJson: toJsonValue(effectiveStacks),
            sectionsJson: toJsonValue(effectiveSections),
            blueprintJson: toJsonValue(blueprint),
            sectionStateJson: toJsonValue(
              buildExamStateEnvelopeJson({
                examState,
                activeExamInstanceId: blueprint.exams[0]?.instanceId,
                activeExamStartedAt: startedAt.toISOString(),
                integrity: initialIntegrity
              })
            ),
            seed: 0,
            stage: blueprint.exams[0]?.instanceId ?? "submitted",
            status: "in_progress",
            coreQuestionIdsJson: toJsonValue(coreQuestionIds),
            coreAnswersJson: toJsonValue(split.coreAnswers),
            practicalAnswerJson: toJsonValue(split.practicalAnswer),
            practicalEarned: 0,
            practicalPossible: 0,
            logicReasoningAnswerJson: effectiveSections.includes("applied_logic_reasoning")
              ? toJsonValue(split.logicReasoningAnswer)
              : Prisma.JsonNull,
            logicReasoningEarned: 0,
            logicReasoningPossible: 0,
            stateVersion: 0,
            remainingCoreSeconds: split.remainingCoreSeconds,
            remainingPracticalSeconds: split.remainingPracticalSeconds,
            remainingLogicReasoningSeconds: split.remainingLogicReasoningSeconds,
            integrityJson: toJsonValue(initialIntegrity),
            startedAt
          }
        });

        if (linkedCandidateAssessmentId) {
          await linkCandidateAssessmentAttemptInTx({
            tx,
            candidateAssessmentId: linkedCandidateAssessmentId,
            attemptId: created.id,
            linkedAt: startedAt
          });
        }

        return created;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      break;
    } catch (error) {
      if (!input.inviteId) {
        throw error;
      }

      const existing = await prisma.attempt.findFirst({
        where: {
          inviteId: input.inviteId,
          participantId: input.participantId,
          status: "in_progress"
        },
        orderBy: {
          startedAt: "desc"
        }
      });

      if (existing) {
        attempt = existing;
        break;
      }

      if (startRetry === maxStartRetries - 1) {
        throw error;
      }
    }
  }

  return { attempt: mapAttempt(attempt), blueprint };
}

export async function patchAttempt(
  attemptId: string,
  patch: Partial<
    Pick<AttemptRecord, "stage"> & {
      expectedStateVersion: number;
      integrity: Partial<AttemptRecord["integrity"]>;
      examState: Partial<Record<string, ExamState>>;
      sectionState: Partial<Record<SectionId, SectionState>>;
    }
  >
) : Promise<AttemptMutationResult> {
  const currentRow = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!currentRow) return { status: "missing" };

  const current = mapAttempt(currentRow);
  if (current.status === "submitted") {
    return { status: "submitted", attempt: current };
  }
  if (
    typeof patch.expectedStateVersion === "number" &&
    patch.expectedStateVersion !== current.stateVersion
  ) {
    return { status: "conflict", attempt: current };
  }
  const now = new Date();
  const currentEnvelope = checkpointActiveExamState({
    envelope: parseExamStateEnvelope(currentRow.sectionStateJson),
    blueprint: current.blueprint,
    stage: currentRow.stage,
    status: currentRow.status,
    now
  });

  const mergedExamState: Partial<Record<string, ExamState>> = {
    ...currentEnvelope.examState
  };

  if (patch.examState) {
    for (const exam of current.blueprint.exams) {
      const incoming = patch.examState[exam.instanceId];
      if (!incoming) continue;
      const existing = mergedExamState[exam.instanceId] ?? { answers: {}, remainingSeconds: exam.durationMinutes * 60 };
      mergedExamState[exam.instanceId] = {
        answers: { ...(existing.answers ?? {}), ...(incoming.answers ?? {}) },
        remainingSeconds:
          typeof incoming.remainingSeconds === "number"
            ? Math.max(0, Math.min(existing.remainingSeconds, incoming.remainingSeconds))
            : existing.remainingSeconds,
        earned: typeof incoming.earned === "number" ? incoming.earned : existing.earned,
        possible: typeof incoming.possible === "number" ? incoming.possible : existing.possible
      };
    }
  }

  if (patch.sectionState) {
    for (const sectionId of current.sections) {
      const incoming = patch.sectionState[sectionId];
      if (!incoming) continue;
      const exam = current.blueprint.exams.find((item) => item.legacySectionId === sectionId);
      if (!exam) continue;
      const existing = mergedExamState[exam.instanceId] ?? { answers: {}, remainingSeconds: exam.durationMinutes * 60 };
      mergedExamState[exam.instanceId] = {
        answers: { ...(existing.answers ?? {}), ...(incoming.answers ?? {}) },
        remainingSeconds:
          typeof incoming.remainingSeconds === "number"
            ? Math.max(0, Math.min(existing.remainingSeconds, incoming.remainingSeconds))
            : existing.remainingSeconds,
        earned: typeof incoming.earned === "number" ? incoming.earned : existing.earned,
        possible: typeof incoming.possible === "number" ? incoming.possible : existing.possible
      };
    }
  }

  const mergedSectionState = legacySectionStateFromBlueprint(current.blueprint, mergedExamState);
  const split = splitSectionState(mergedSectionState);
  const nextIntegrity = patch.integrity
    ? {
        tabHiddenCount: Number(patch.integrity.tabHiddenCount ?? current.integrity.tabHiddenCount),
        copyCount: Number(patch.integrity.copyCount ?? current.integrity.copyCount),
        pasteCount: Number(patch.integrity.pasteCount ?? current.integrity.pasteCount)
      }
    : current.integrity;
  const nextStage = resolveProgressStage(
    current.stage,
    typeof patch.stage === "string" ? patch.stage : undefined,
    current.blueprint
  );

  const updated = await prisma.attempt.updateMany({
    where: {
      id: attemptId,
      status: "in_progress",
      stateVersion: current.stateVersion
    },
    data: {
      stage: nextStage,
      stateVersion: {
        increment: 1
      },
      sectionStateJson: toJsonValue(
        buildExamStateEnvelopeJson({
          examState: mergedExamState,
          activeExamInstanceId: nextStage === "submitted" ? undefined : nextStage,
          activeExamStartedAt: nextStage === "submitted" ? undefined : now.toISOString(),
          integrity: nextIntegrity
        })
      ),
      coreAnswersJson: toJsonValue(split.coreAnswers),
      practicalAnswerJson: toJsonValue(split.practicalAnswer),
      logicReasoningAnswerJson: current.sections.includes("applied_logic_reasoning")
        ? toJsonValue(split.logicReasoningAnswer)
        : Prisma.JsonNull,
      remainingCoreSeconds: split.remainingCoreSeconds,
      remainingPracticalSeconds: split.remainingPracticalSeconds,
      remainingLogicReasoningSeconds: split.remainingLogicReasoningSeconds,
      integrityJson: toJsonValue(nextIntegrity)
    }
  });

  if (updated.count !== 1) {
    const latestRow = await prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!latestRow) return { status: "missing" };
    const latest = mapAttempt(latestRow);
    return latest.status === "submitted"
      ? { status: "submitted", attempt: latest }
      : { status: "conflict", attempt: latest };
  }

  const updatedRow = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!updatedRow) {
    return { status: "missing" };
  }

  return { status: "updated", attempt: mapAttempt(updatedRow) };
}

export async function submitAttempt(input: {
  attemptId: string;
  expectedStateVersion?: number;
}): Promise<SubmitAttemptResult> {
  const currentRow = await prisma.attempt.findUnique({ where: { id: input.attemptId } });
  if (!currentRow) return { status: "missing" };

  const current = mapAttempt(currentRow);
  if (current.status === "submitted") {
    const existingResult = await loadResultSummary(input.attemptId);
    if (!existingResult) {
      return { status: "missing" };
    }
    return { status: "submitted", attempt: current, result: existingResult };
  }
  if (
    typeof input.expectedStateVersion === "number" &&
    input.expectedStateVersion !== current.stateVersion
  ) {
    return { status: "conflict", attempt: current };
  }

  const result = buildResultSummary({
    attemptId: current.id,
    roleId: current.roleId,
    stacks: current.stacks,
    passTargetPercent: current.passTargetPercent,
    blueprint: current.blueprint,
    examState: current.examState,
    integrity: current.integrity
  });

  const submittedExamState: Partial<Record<string, ExamState>> = {
    ...current.examState
  };

  for (const exam of current.blueprint.exams) {
    const examResult = result.examBreakdown[exam.instanceId];
    if (!examResult) continue;
    const existing = submittedExamState[exam.instanceId] ?? {
      answers: {},
      remainingSeconds: exam.durationMinutes * 60
    };
    submittedExamState[exam.instanceId] = {
      ...existing,
      earned: examResult.pointsEarned,
      possible: examResult.pointsPossible
    };
  }

  const submittedSectionState = legacySectionStateFromBlueprint(current.blueprint, submittedExamState);
  const split = splitSectionState(submittedSectionState);
  const submittedAt = new Date();

  const submitted = await prisma.$transaction(async (tx) => {
    const updated = await tx.attempt.updateMany({
      where: {
        id: input.attemptId,
        status: "in_progress",
        stateVersion: current.stateVersion
      },
      data: {
        status: "submitted",
        stage: "submitted",
        stateVersion: {
          increment: 1
        },
        sectionStateJson: toJsonValue(
          buildExamStateEnvelopeJson({
            examState: submittedExamState,
            integrity: current.integrity
          })
        ),
        practicalEarned: split.practicalEarned,
        practicalPossible: split.practicalPossible,
        logicReasoningEarned: split.logicReasoningEarned,
        logicReasoningPossible: split.logicReasoningPossible,
        integrityJson: toJsonValue(current.integrity),
        submittedAt
      }
    });

    if (updated.count !== 1) {
      return false;
    }

    await tx.result.upsert({
      where: { attemptId: input.attemptId },
      update: {
        contextType: current.contextType,
        corePercent: result.corePercent,
        practicalPercent: result.practicalPercent,
        finalPercent: result.finalPercent,
        pass: result.pass,
        borderline: result.borderline,
        breakdownJson: toJsonValue({
          sections: result.sections,
          exams: result.exams,
          passPercent: result.passPercent,
          practicalMinPercent: result.practicalMinPercent,
          sectionBreakdown: result.sectionBreakdown,
          examBreakdown: result.examBreakdown,
          breakdownByCategory: result.breakdownByCategory
        })
      },
      create: {
        id: cuidLike(),
        attemptId: input.attemptId,
        contextType: current.contextType,
        reviewState: "unreviewed",
        corePercent: result.corePercent,
        practicalPercent: result.practicalPercent,
        finalPercent: result.finalPercent,
        pass: result.pass,
        borderline: result.borderline,
        breakdownJson: toJsonValue({
          sections: result.sections,
          exams: result.exams,
          passPercent: result.passPercent,
          practicalMinPercent: result.practicalMinPercent,
          sectionBreakdown: result.sectionBreakdown,
          examBreakdown: result.examBreakdown,
          breakdownByCategory: result.breakdownByCategory
        })
      }
    });
    return true;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  if (!submitted) {
    const latestRow = await prisma.attempt.findUnique({ where: { id: input.attemptId } });
    if (!latestRow) return { status: "missing" };
    const latest = mapAttempt(latestRow);
    if (latest.status === "submitted") {
      const existingResult = await loadResultSummary(input.attemptId);
      if (!existingResult) {
        return { status: "missing" };
      }
      return { status: "submitted", attempt: latest, result: existingResult };
    }
    return { status: "conflict", attempt: latest };
  }

  const updatedRow = await prisma.attempt.findUnique({ where: { id: input.attemptId } });
  if (!updatedRow) {
    return { status: "missing" };
  }

  return {
    status: "submitted",
    attempt: mapAttempt(updatedRow),
    result
  };
}

async function loadResultSummary(attemptId: string) {
  const resultRow = await prisma.result.findUnique({
    where: { attemptId }
  });
  if (!resultRow) return null;

  const attemptRow = await prisma.attempt.findUnique({
    where: { id: attemptId }
  });
  if (!attemptRow) return null;

  const participantRow = await prisma.participant.findUnique({
    where: { id: attemptRow.participantId }
  });

  return toResultSummary(
    resultRow,
    mapAttempt(attemptRow),
    participantRow ? mapParticipant(participantRow) : null
  );
}

export async function getAttempt(attemptId: string) {
  const row = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!row) return null;
  const participant = await prisma.participant.findUnique({
    where: { id: row.participantId }
  });
  const attempt = mapAttempt(row);
  return {
    ...attempt,
    candidateName: participant?.fullName ?? undefined,
    candidateEmail: participant?.email ?? undefined
  };
}
