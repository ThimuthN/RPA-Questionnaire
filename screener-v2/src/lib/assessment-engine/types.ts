import type { SectionId } from "@/lib/sections/types";

export type RoleId = "Intern" | "Associate" | "SE" | "SeniorSE" | "TechLead";

export type StackId = "UiPath" | "AutomationAnywhere" | "Python" | "PowerAutomate";

export type AddonId = "applied_logic_reasoning";

export type QuestionFormatId =
  | "single_select"
  | "multi_select"
  | "ordering"
  | "matching"
  | "fill_blank_constrained"
  | "log_analysis_single_select"
  | "trace_execution"
  | "best_next_step"
  | "case_triage"
  | "practical_task"
  | "logic_reasoning";

export type PromptBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "list";
      heading?: string;
      items: string[];
      style?: "cards" | "plain";
    }
  | {
      type: "table";
      heading?: string;
      headers: string[];
      rows: string[][];
    }
  | {
      type: "prompt";
      text: string;
    };

export type ScoringMethod =
  | "all_or_nothing"
  | "partial_with_penalty"
  | "partial_position"
  | "partial_pairs_with_penalty"
  | "partial_by_blank";

export interface QuestionBase {
  id: string;
  roleLevelMin: RoleId;
  roleLevelMax: RoleId | null;
  seniorOnly?: boolean;
  leadOnly?: boolean;
  techStack: "General" | StackId;
  category: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  format: QuestionFormatId;
  points: number;
  scoringMethod: ScoringMethod;
  prompt: string;
  promptBlocks?: PromptBlock[];
  explanation: string;
  rationale: string;
}

export interface SingleLikeQuestion extends QuestionBase {
  options: string[];
  correctAnswer: string[];
  logSnippet?: string;
}

export interface OrderingQuestion extends QuestionBase {
  items: string[];
  correctOrder: number[];
}

export interface MatchingQuestion extends QuestionBase {
  leftItems: string[];
  rightItems: string[];
  correctPairs: Record<string, string>;
}

export interface FillBlankQuestion extends QuestionBase {
  blank: string;
  choices: string[];
  acceptedAnswers: string[];
}

export type Question =
  | (SingleLikeQuestion & { format: "single_select" })
  | (SingleLikeQuestion & { format: "best_next_step" })
  | (SingleLikeQuestion & { format: "log_analysis_single_select" })
  | (SingleLikeQuestion & { format: "trace_execution" })
  | (SingleLikeQuestion & { format: "case_triage" })
  | (SingleLikeQuestion & { format: "multi_select" })
  | (OrderingQuestion & { format: "ordering" })
  | (MatchingQuestion & { format: "matching" })
  | (FillBlankQuestion & { format: "fill_blank_constrained" });

export interface AssessmentBlueprint {
  roleId: RoleId;
  questionCount: number;
  timeLimitSeconds: number;
  passPercentage: number;
  generalMinimum: number;
  stackMinimum: number;
  logAnalysisMinimum: number;
  formatTargets: Record<string, number>;
  difficultyTargets: Record<string, number>;
  practicalWeightPercent: number;
  practicalMinPercent: number;
}

export interface AttemptState {
  attemptId: string;
  participantId: string;
  roleId: RoleId;
  stacks: StackId[];
  sections: SectionId[];
  stage: SectionId | "submitted";
  seed: number;
  selectedQuestionIds: string[];
  answers: Record<string, unknown>;
  practicalAnswer: Record<string, unknown>;
  remainingCoreSeconds: number;
  remainingPracticalSeconds: number;
  integrity: { tabHiddenCount: number; copyCount: number; pasteCount: number };
}

export interface RoleConfig {
  label: string;
  time_limit_minutes: number;
  question_count: number;
  pass_percentage: number;
  log_analysis_minimum: number;
  general_minimum: number;
  stack_minimum: number;
  senior_only_minimum: number;
  lead_only_minimum: number;
  format_targets: Record<string, number>;
  difficulty_targets: Record<string, number>;
}

export interface AddonConfig {
  label: string;
  description: string;
  time_limit_minutes: number;
  enabled: boolean;
}

export interface ConfigV2 {
  schemaVersion: string;
  questionBankVersion: string;
  borderlineReviewBandPercent?: number;
  canonicalRoleOrder: RoleId[];
  stacks: StackId[];
  stackLabels: Record<StackId, string>;
  roles: Record<RoleId, RoleConfig>;
  addons: Record<AddonId, AddonConfig>;
}

export interface SelectionMeta {
  optionOrderMap?: number[];
  choiceOrderMap?: number[];
  orderingInitialOrder?: number[];
  pairRightOrder?: number[];
}

export interface SelectedQuestion {
  id: string;
  meta: SelectionMeta;
}

export interface SelectionResult {
  selected: Question[];
  seed: number;
  seedKey: string;
  effectiveSeed: number;
  selectedIds: string[];
}

export interface ScoreOutput {
  normalized: number;
  pointsEarned: number;
  pointsPossible: number;
  isCorrect: boolean;
}

export interface SectionBreakdownItem {
  label: string;
  pointsEarned: number;
  pointsPossible: number;
  percent: number;
  requiredPercent: number;
  pass: boolean;
}

export type SectionBreakdown = Partial<Record<SectionId, SectionBreakdownItem>>;

export interface ResultSummary {
  attemptId: string;
  roleId: RoleId;
  stacks: StackId[];
  sections: SectionId[];
  corePercent: number;
  practicalPercent: number;
  finalPercent: number;
  passPercent: number;
  practicalMinPercent: number;
  pass: boolean;
  borderline: boolean;
  sectionBreakdown: SectionBreakdown;
  breakdownByCategory: Record<string, { correctCount: number; totalCount: number; percent: number }>;
}
