import { buildResultSummary } from "@/lib/assessment-engine/scoring";
import type {
  ExamBlueprint,
  ExamDefinitionId,
  ExamQuestion,
  ExamState
} from "@/lib/assessment-engine/types";
import { deriveExamSelectionMetadata } from "@/lib/exams/catalog";
import { buildReviewSectionsFromBlueprint } from "@/lib/exams/review";
import { resolveExamItems } from "@/lib/exams/server-registry";
import type {
  ApplicationScreeningAddon,
  ApplicationScreeningAddonResultItem,
  ApplicationScreeningPackage,
  ApplicationScreeningQuestion,
  ApplicationScreeningResponseItem,
  ApplicationScreeningStatus
} from "@/lib/jobs/types";
import { questionRegistry } from "@/lib/question-types";

type ScreeningPresetAddonLike = {
  id?: string | null;
  slug?: string | null;
  label: string;
  assessmentTypeId: string;
  defaultConfig?: unknown;
  defaultConfigJson?: unknown;
  defaultRequiredPercent: number;
  defaultWeight: number;
};

type ScreeningPresetItemLike = {
  sortOrder: number;
  weightOverride?: number | null;
  configOverride?: unknown;
  configOverrideJson?: unknown;
  addon: ScreeningPresetAddonLike;
};

type ScreeningPresetLike = {
  id: string;
  label: string;
  items: ScreeningPresetItemLike[];
};

export type ApplicationScreeningAnswerMap = Record<string, Record<string, unknown>>;

export type ApplicationScreeningResponseDraft = ApplicationScreeningResponseItem & {
  answerJson: unknown;
};

export type ApplicationScreeningAddonEvaluation = ApplicationScreeningAddonResultItem & {
  addonKey: string;
  addonSlug: string;
  assessmentTypeId: ExamDefinitionId;
  presetId: string;
  presetLabel: string;
  sortOrder: number;
  inlineSupportReason?: string;
  responses: ApplicationScreeningResponseDraft[];
};

export type ApplicationScreeningEvaluation = {
  overallStatus: ApplicationScreeningStatus;
  addonResults: ApplicationScreeningAddonEvaluation[];
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function buildAddonKey(item: ScreeningPresetItemLike): string {
  const sourceKey = item.addon.slug?.trim() || item.addon.assessmentTypeId.trim();
  return `${sourceKey}:${item.sortOrder}`;
}

function toScreeningQuestions(items: ExamQuestion[]): ApplicationScreeningQuestion[] {
  return items.map((question, index) => ({
    ...question,
    sortOrder: index
  }));
}

function getInlineSupportReason(questions: ApplicationScreeningQuestion[]): string | undefined {
  if (questions.length === 0) {
    return "This add-on does not expose inline application questions.";
  }

  const unsupported = questions.find((question) => !questionRegistry[question.format]);
  if (!unsupported) {
    return undefined;
  }

  return `Question format "${unsupported.format}" is not supported inline.`;
}

function buildInlineBlueprint(packageState: ApplicationScreeningPackage): ExamBlueprint {
  return {
    exams: packageState.addons
      .filter((addon) => addon.inlineSupported)
      .map((addon) => ({
        instanceId: addon.key,
        definitionId: addon.assessmentTypeId,
        label: addon.addonLabel,
        order: addon.sortOrder,
        config: {},
        configSummary: addon.configSummary,
        durationMinutes: addon.durationMinutes,
        weight: addon.weight,
        requiredPercent: addon.requiredPercent,
        contentSnapshot: {
          title: addon.addonLabel,
          description: addon.configSummary,
          items: addon.questions.map(({ sortOrder: _sortOrder, ...question }) => question)
        }
      }))
  };
}

function buildInlineExamState(
  packageState: ApplicationScreeningPackage,
  answers: ApplicationScreeningAnswerMap
): Partial<Record<string, ExamState>> {
  return Object.fromEntries(
    packageState.addons
      .filter((addon) => addon.inlineSupported)
      .map((addon) => [
        addon.key,
        {
          answers: answers[addon.key] ?? {},
          remainingSeconds: 0
        } satisfies ExamState
      ])
  );
}

function buildResponseAnswerMap(
  addon: ApplicationScreeningAddon,
  addonAnswers: Record<string, unknown>
): Record<string, unknown> {
  const responseAnswerMap: Record<string, unknown> = {};

  for (const question of addon.questions) {
    const questionAnswer = addonAnswers[question.id];

    if (
      question.format === "questionnaire_form" &&
      questionAnswer &&
      typeof questionAnswer === "object" &&
      !Array.isArray(questionAnswer)
    ) {
      for (const field of question.fields) {
        responseAnswerMap[field.id] =
          (questionAnswer as Record<string, unknown>)[field.id] ?? null;
      }
      continue;
    }

    responseAnswerMap[question.id] = questionAnswer ?? null;
  }

  return responseAnswerMap;
}

function toOverallStatus(
  addonResults: ApplicationScreeningAddonEvaluation[]
): ApplicationScreeningStatus {
  if (addonResults.some((addon) => addon.isMandatory && addon.status === "failed")) {
    return "failed";
  }

  if (addonResults.some((addon) => addon.status === "needs_review")) {
    return "needs_review";
  }

  return "passed";
}

export function resolveApplicationScreeningPackageFromPreset(
  preset: ScreeningPresetLike | null | undefined
): ApplicationScreeningPackage | null {
  if (!preset) {
    return null;
  }

  const addons: ApplicationScreeningAddon[] = preset.items
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => {
      const config = {
        ...asRecord(item.addon.defaultConfig ?? item.addon.defaultConfigJson),
        ...asRecord(item.configOverride ?? item.configOverrideJson)
      };
      const metadata = deriveExamSelectionMetadata(
        item.addon.assessmentTypeId as ExamDefinitionId,
        config,
        item.addon.defaultRequiredPercent
      );
      const questions = toScreeningQuestions(
        resolveExamItems(item.addon.assessmentTypeId as ExamDefinitionId, config)
      );
      const inlineSupportReason = getInlineSupportReason(questions);

      return {
        key: buildAddonKey(item),
        addonId: item.addon.id ?? undefined,
        addonSlug: item.addon.slug?.trim() || item.addon.assessmentTypeId,
        addonLabel: item.addon.label,
        assessmentTypeId: item.addon.assessmentTypeId as ExamDefinitionId,
        configSummary: metadata.configSummary,
        durationMinutes: metadata.durationMinutes,
        requiredPercent: metadata.requiredPercent,
        weight:
          typeof item.weightOverride === "number"
            ? Math.max(0, Math.round(item.weightOverride))
            : item.addon.defaultWeight,
        isMandatory: true,
        inlineSupported: !inlineSupportReason,
        inlineSupportReason,
        sortOrder: item.sortOrder,
        questions
      };
    });

  return {
    presetId: preset.id,
    presetLabel: preset.label,
    addons
  };
}

export function hasInlineApplicationScreening(
  packageState: ApplicationScreeningPackage | null
): boolean {
  return Boolean(packageState?.addons.some((addon) => addon.inlineSupported));
}

export function normalizeApplicationScreeningAnswerMap(
  rawAnswers: unknown
): ApplicationScreeningAnswerMap {
  const answers = asRecord(rawAnswers);

  return Object.fromEntries(
    Object.entries(answers).map(([addonKey, addonAnswers]) => [addonKey, asRecord(addonAnswers)])
  );
}

export function validateApplicationScreeningAnswerMap(
  packageState: ApplicationScreeningPackage | null,
  answers: ApplicationScreeningAnswerMap
): { ok: true } | { ok: false; reason: string } {
  if (!packageState) {
    return { ok: true };
  }

  for (const addon of packageState.addons) {
    if (!addon.inlineSupported) {
      continue;
    }

    const addonAnswers = answers[addon.key] ?? {};

    for (const question of addon.questions) {
      const definition = questionRegistry[question.format];
      if (!definition) {
        return {
          ok: false,
          reason:
            addon.inlineSupportReason ??
            `Question format "${question.format}" is not supported inline.`
        };
      }

      const result = definition.validateAnswer(
        question as never,
        addonAnswers[question.id] as never
      );
      if (!result.ok) {
        return {
          ok: false,
          reason: result.reason ?? `Complete ${addon.addonLabel} before continuing.`
        };
      }
    }
  }

  return { ok: true };
}

export function evaluateApplicationScreening(
  packageState: ApplicationScreeningPackage | null,
  answers: ApplicationScreeningAnswerMap
): ApplicationScreeningEvaluation {
  if (!packageState) {
    return {
      overallStatus: "passed",
      addonResults: []
    };
  }

  const inlineBlueprint = buildInlineBlueprint(packageState);
  const inlineExamState = buildInlineExamState(packageState, answers);
  const summary =
    inlineBlueprint.exams.length > 0
      ? buildResultSummary({
          attemptId: "application-screening",
          stacks: [],
          passTargetPercent: 0,
          blueprint: inlineBlueprint,
          examState: inlineExamState
        })
      : null;
  const reviewSections =
    inlineBlueprint.exams.length > 0
      ? buildReviewSectionsFromBlueprint(inlineBlueprint, inlineExamState)
      : [];
  const breakdownByAddonKey = new Map(
    Object.values(summary?.examBreakdown ?? {}).map((row) => [row.instanceId, row])
  );
  const reviewByAddonKey = new Map(reviewSections.map((section) => [section.id, section]));

  const addonResults: ApplicationScreeningAddonEvaluation[] = packageState.addons.map((addon) => {
    if (!addon.inlineSupported) {
      return {
        addonKey: addon.key,
        addonId: addon.addonId,
        addonSlug: addon.addonSlug,
        addonLabel: addon.addonLabel,
        assessmentTypeId: addon.assessmentTypeId,
        presetId: packageState.presetId,
        presetLabel: packageState.presetLabel,
        sortOrder: addon.sortOrder,
        requiredPercent: addon.requiredPercent,
        weight: addon.weight,
        isMandatory: addon.isMandatory,
        inlineSupported: false,
        inlineSupportReason: addon.inlineSupportReason,
        status: "needs_review",
        applicantPercent: null,
        pointsEarned: 0,
        pointsPossible: 0,
        responses: []
      };
    }

    const breakdown = breakdownByAddonKey.get(addon.key);
    const review = reviewByAddonKey.get(addon.key);
    const addonAnswers = answers[addon.key] ?? {};
    const responseAnswerMap = buildResponseAnswerMap(addon, addonAnswers);

    return {
      addonKey: addon.key,
      addonId: addon.addonId,
      addonSlug: addon.addonSlug,
      addonLabel: addon.addonLabel,
      assessmentTypeId: addon.assessmentTypeId,
      presetId: packageState.presetId,
      presetLabel: packageState.presetLabel,
      sortOrder: addon.sortOrder,
      requiredPercent: addon.requiredPercent,
      weight: addon.weight,
      isMandatory: addon.isMandatory,
      inlineSupported: true,
      status: breakdown?.pass ? "passed" : "failed",
      applicantPercent: breakdown?.percent ?? 0,
      pointsEarned: breakdown?.pointsEarned ?? 0,
      pointsPossible: breakdown?.pointsPossible ?? 0,
      responses:
        review?.items.map((item, responseIndex) => ({
          addonLabel: addon.addonLabel,
          questionKey: item.id,
          questionLabel: item.title,
          formatLabel: item.formatLabel,
          answerText:
            item.candidateAnswerLines.length > 0
              ? item.candidateAnswerLines.join("\n")
              : null,
          answerJson: responseAnswerMap[item.id] ?? null,
          pointsEarned: item.pointsEarned,
          pointsPossible: item.pointsPossible,
          sortOrder: addon.sortOrder * 1000 + responseIndex
        })) ?? []
    };
  });

  return {
    overallStatus: toOverallStatus(addonResults),
    addonResults
  };
}
