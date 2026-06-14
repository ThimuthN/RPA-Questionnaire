import type {
  ApplicationScreeningAddonResultItem,
  ApplicationScreeningStatus
} from "@/lib/jobs/types";

type ApplicationScreeningResponseRow = {
  questionKey: string;
  questionLabel: string;
  formatLabel: string;
  answerText: string | null;
  pointsEarned: number;
  pointsPossible: number;
  sortOrder: number;
};

export type ApplicationScreeningAddonResultRow = {
  addonId: string | null;
  addonLabel: string;
  requiredPercent: number;
  weight: number;
  isMandatory: boolean;
  inlineSupported: boolean;
  status: string;
  applicantPercent: number | null;
  pointsEarned: number;
  pointsPossible: number;
  responses: ApplicationScreeningResponseRow[];
};

export function deriveApplicationScreeningStatus(
  rows: Array<{ status: string; isMandatory: boolean }>
): ApplicationScreeningStatus | null {
  if (rows.length === 0) {
    return null;
  }

  if (rows.some((row) => row.isMandatory && row.status === "failed")) {
    return "failed";
  }

  if (rows.some((row) => row.status === "needs_review")) {
    return "needs_review";
  }

  return "passed";
}

export function mapApplicationScreeningAddonResult(
  row: ApplicationScreeningAddonResultRow
): ApplicationScreeningAddonResultItem {
  return {
    addonId: row.addonId ?? undefined,
    addonLabel: row.addonLabel,
    requiredPercent: row.requiredPercent,
    weight: row.weight,
    isMandatory: row.isMandatory,
    inlineSupported: row.inlineSupported,
    status: row.status as ApplicationScreeningStatus,
    applicantPercent: row.applicantPercent,
    pointsEarned: row.pointsEarned,
    pointsPossible: row.pointsPossible,
    responses: row.responses
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((response) => ({
        addonLabel: row.addonLabel,
        questionKey: response.questionKey,
        questionLabel: response.questionLabel,
        formatLabel: response.formatLabel,
        answerText: response.answerText,
        pointsEarned: response.pointsEarned,
        pointsPossible: response.pointsPossible,
        sortOrder: response.sortOrder
      }))
  };
}
