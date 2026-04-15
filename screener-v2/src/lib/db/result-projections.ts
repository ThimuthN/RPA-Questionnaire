import { Prisma } from "@prisma/client";
import type {
  AssessmentContextType,
  ExamBlueprint,
  ExamState,
  ResultReviewState,
  ResultReviewSection,
  ResultSummary,
  StackId
} from "@/lib/assessment-engine/types";
import {
  carriesRoleContext,
  summarizeExamInstance
} from "@/lib/exams/catalog";
import { getDefaultSelectedSections, normalizeSelectedSections, orderedSections } from "@/lib/sections/registry";
import type { SectionId } from "@/lib/sections/types";
import { toObject } from "@/lib/db/db-utils";
import { buildReviewSectionsFromBlueprint } from "@/lib/exams/review";

interface ResultProjectionAttempt {
  roleId?: string | null;
  stacks: StackId[];
  sections: SectionId[];
  blueprint: ExamBlueprint;
  examState: Partial<Record<string, ExamState>>;
  integrity: { tabHiddenCount: number; copyCount: number; pasteCount: number };
}

interface ResultProjectionParticipant {
  fullName: string;
  email: string;
}

interface ResultProjectionCandidate {
  roleId?: string | null;
  positionAppliedFor?: string | null;
  role?: { label: string | null } | null;
}

interface PersistedBreakdown {
  sections: SectionId[];
  exams: ResultSummary["exams"];
  passPercent: number;
  practicalMinPercent: number;
  sectionBreakdown: ResultSummary["sectionBreakdown"];
  examBreakdown: ResultSummary["examBreakdown"];
  breakdownByCategory: ResultSummary["breakdownByCategory"];
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}


function normalizeBreakdown(
  raw: ResultSummary["sectionBreakdown"] | Record<string, unknown>,
  passPercent: number
): ResultSummary["sectionBreakdown"] {
  const normalized: ResultSummary["sectionBreakdown"] = {};

  for (const section of orderedSections) {
    const rowValue = (raw as Record<string, unknown>)[section.id];
    if (!rowValue || typeof rowValue !== "object" || Array.isArray(rowValue)) continue;

    const row = rowValue as Record<string, unknown>;
    const percent = Number(row.percent ?? 0);
    const requiredPercent = Number(
      row.requiredPercent ?? Math.max(passPercent, section.minPercentRequired ?? 0)
    );

    normalized[section.id] = {
      label: typeof row.label === "string" ? row.label : section.label,
      pointsEarned: Number(row.pointsEarned ?? 0),
      pointsPossible: Number(row.pointsPossible ?? 0),
      percent,
      requiredPercent,
      pass: typeof row.pass === "boolean" ? row.pass : percent >= requiredPercent
    };
  }

  return normalized;
}

function parseBreakdown(
  value: Prisma.JsonValue | null | undefined,
  attempt: ResultProjectionAttempt | null
): PersistedBreakdown {
  const fallbackSections = attempt?.sections ?? getDefaultSelectedSections();
  const fallbackExams = attempt?.blueprint.exams.map(summarizeExamInstance) ?? [];
  const parsed = toObject<Record<string, unknown>>(value, {});
  const passPercent = Number(parsed.passPercent ?? 0);
  const rawSections = Array.isArray(parsed.sections) ? (parsed.sections as SectionId[]) : fallbackSections;
  const sections = normalizeSelectedSections(rawSections);
  const rawSectionBreakdown = toObject<Record<string, unknown>>(
    parsed.sectionBreakdown as Prisma.JsonValue,
    {}
  );
  const exams = Array.isArray(parsed.exams) ? (parsed.exams as ResultSummary["exams"]) : fallbackExams;
  const examBreakdown = toObject<ResultSummary["examBreakdown"]>(
    parsed.examBreakdown as Prisma.JsonValue,
    {}
  );

  return {
    sections,
    exams,
    passPercent,
    practicalMinPercent: Number(parsed.practicalMinPercent ?? 0),
    sectionBreakdown: normalizeBreakdown(rawSectionBreakdown, passPercent),
    examBreakdown,
    breakdownByCategory: toObject<ResultSummary["breakdownByCategory"]>(
      parsed.breakdownByCategory as Prisma.JsonValue,
      {}
    )
  };
}

export function toResultSummary(
  resultRow: {
    attemptId: string;
    contextType?: string;
    reviewState?: string;
    corePercent: number;
    practicalPercent: number;
    finalPercent: number;
    pass: boolean;
    borderline: boolean;
    breakdownJson: Prisma.JsonValue;
  },
  attempt: ResultProjectionAttempt | null,
  participant?: ResultProjectionParticipant | null,
  candidate?: ResultProjectionCandidate | null
): ResultSummary | null {
  if (!attempt) return null;

  const breakdown = parseBreakdown(resultRow.breakdownJson, attempt);
  const corePercent = breakdown.sectionBreakdown.core?.percent ?? resultRow.corePercent;
  const practicalPercent = breakdown.sectionBreakdown.practical?.percent ?? resultRow.practicalPercent;
  const exams =
    breakdown.exams.length > 0 ? breakdown.exams : attempt.blueprint.exams.map(summarizeExamInstance);
  const coreExam = attempt.blueprint.exams.find((exam) => carriesRoleContext(exam.definitionId));
  const coreExamRoleId =
    typeof coreExam?.config?.roleId === "string" && coreExam.config.roleId.trim().length > 0
      ? coreExam.config.roleId.trim()
      : undefined;
  const coreExamRoleLabel =
    typeof coreExam?.config?.roleLabel === "string" && coreExam.config.roleLabel.trim().length > 0
      ? coreExam.config.roleLabel.trim()
      : undefined;
  const examBreakdown =
    Object.keys(breakdown.examBreakdown).length > 0
      ? Object.fromEntries(
          exams.map((exam) => {
            const persisted = breakdown.examBreakdown[exam.instanceId];
            const weightedMarksPossible = Number(persisted?.weightedMarksPossible ?? exam.weight);
            const fallbackPercent =
              typeof persisted?.percent === "number"
                ? persisted.percent
                : Number(persisted?.pointsPossible ?? 0) > 0
                  ? (Number(persisted?.pointsEarned ?? 0) / Number(persisted?.pointsPossible ?? 0)) * 100
                  : undefined;
            const weightedMarksEarned =
              typeof persisted?.weightedMarksEarned === "number"
                ? persisted.weightedMarksEarned
                : typeof fallbackPercent === "number"
                  ? roundOne((fallbackPercent * weightedMarksPossible) / 100)
                  : Number(breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.pointsEarned ?? 0);

            return [
              exam.instanceId,
              {
                instanceId: exam.instanceId,
                definitionId: exam.definitionId,
                legacySectionId: exam.legacySectionId,
                label: persisted?.label ?? exam.label,
                configSummary: persisted?.configSummary ?? exam.configSummary,
                durationMinutes: Number(persisted?.durationMinutes ?? exam.durationMinutes),
                pointsEarned: Number(persisted?.pointsEarned ?? 0),
                pointsPossible: Number(persisted?.pointsPossible ?? 0),
                percent: Number(persisted?.percent ?? 0),
                weightedMarksEarned,
                weightedMarksPossible,
                requiredPercent: Number(
                  persisted?.requiredPercent ??
                    breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.requiredPercent ??
                    exam.requiredPercent
                ),
                pass:
                  typeof persisted?.pass === "boolean"
                    ? persisted.pass
                    : (persisted?.percent ?? 0) >= exam.requiredPercent,
                order: Number(persisted?.order ?? exam.order)
              }
            ];
          })
        )
      : Object.fromEntries(
          exams.map((exam) => [
            exam.instanceId,
            {
              instanceId: exam.instanceId,
              definitionId: exam.definitionId,
              legacySectionId: exam.legacySectionId,
              label: exam.label,
              configSummary: exam.configSummary,
              durationMinutes: exam.durationMinutes,
              pointsEarned: breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.pointsEarned ?? 0,
              pointsPossible:
                breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.pointsPossible ?? 0,
              percent: breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.percent ?? 0,
              weightedMarksEarned:
                breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.pointsEarned ?? 0,
              weightedMarksPossible: exam.weight,
              requiredPercent:
                breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.requiredPercent ??
                exam.requiredPercent,
              pass: breakdown.sectionBreakdown[exam.legacySectionId ?? "core"]?.pass ?? false,
              order: exam.order
            }
          ])
        );

    return {
      attemptId: resultRow.attemptId,
      candidateName: participant?.fullName,
      candidateEmail: participant?.email,
      candidateRoleId: candidate?.roleId ?? undefined,
      candidateRoleLabel: candidate?.role?.label ?? candidate?.positionAppliedFor ?? undefined,
      contextType: (resultRow.contextType as AssessmentContextType | undefined) ?? "general",
      reviewState: (resultRow.reviewState as ResultReviewState | undefined) ?? "unreviewed",
      roleId: attempt.roleId ?? undefined,
      coreExamRoleId,
      coreExamRoleLabel,
      stacks: attempt.stacks,
    sections: breakdown.sections,
    exams,
    corePercent,
    practicalPercent,
    finalPercent: resultRow.finalPercent,
    passPercent: breakdown.passPercent,
    practicalMinPercent: breakdown.practicalMinPercent,
    pass: resultRow.pass,
    borderline: resultRow.borderline,
    integrity: attempt.integrity,
    sectionBreakdown: breakdown.sectionBreakdown,
    examBreakdown,
    breakdownByCategory: breakdown.breakdownByCategory
  };
}

export function buildReviewSections(attempt: ResultProjectionAttempt): ResultReviewSection[] {
  return buildReviewSectionsFromBlueprint(attempt.blueprint, attempt.examState);
}
