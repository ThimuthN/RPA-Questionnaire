import type { SectionId } from "@/lib/sections/types";
import type { CandidateAssessmentStatus, CandidateNextAction, CandidateStage, CandidateUiStatus } from "@/lib/candidates/types";

export type RoleId = "Intern" | "Associate" | "SE" | "SeniorSE" | "TechLead";

export type StackId = "UiPath" | "AutomationAnywhere" | "Python" | "PowerAutomate";

export type AddonId = "applied_logic_reasoning";

export type IntegrityPresetId = "strict" | "standard" | "relaxed";

export const assessmentContextTypeValues = [
  "general",
  "hiring",
  "promotion",
  "training",
  "certification"
] as const;

export type AssessmentContextType = (typeof assessmentContextTypeValues)[number];

export const resultReviewStateValues = ["unreviewed", "reviewed", "flagged"] as const;

export type ResultReviewState = (typeof resultReviewStateValues)[number];

export type ExamDefinitionId =
  | "core_exam"
  | "practical_exam"
  | "applied_logic_exam"
  | "general_capability_exam";

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

export interface CompositeOption {
  id: string;
  label: string;
}

export interface CompositeSingleSelectSubtask {
  id: string;
  type: "single_select";
  label: string;
  promptBlocks?: PromptBlock[];
  points: number;
  expected: string;
  options: CompositeOption[];
}

export interface CompositeMatchingSubtask {
  id: string;
  type: "matching";
  label: string;
  promptBlocks?: PromptBlock[];
  points: number;
  leftItems: string[];
  rightOptions: CompositeOption[];
  expected: Record<string, string>;
}

export type CompositeSubtask = CompositeSingleSelectSubtask | CompositeMatchingSubtask;

export interface PracticalTaskQuestion {
  id: string;
  format: "practical_task";
  prompt: string;
  promptBlocks?: PromptBlock[];
  points: number;
  title?: string;
  subtasks: CompositeSubtask[];
}

export interface LogicReasoningQuestion {
  id: string;
  format: "logic_reasoning";
  prompt: string;
  promptBlocks?: PromptBlock[];
  points: number;
  title?: string;
  subtasks: CompositeSubtask[];
}

export type ExamQuestion = Question | PracticalTaskQuestion | LogicReasoningQuestion;

export interface ExamConfigFieldOption {
  value: string;
  label: string;
  description?: string;
}

export interface ExamConfigFieldDefinition {
  key: string;
  label: string;
  description?: string;
  type: "single_select" | "multi_select";
  required: boolean;
  options: ExamConfigFieldOption[];
}

export interface ExamBlueprintDraftItem {
  definitionId: ExamDefinitionId;
  sourceAddonId?: string;
  sourcePresetId?: string;
  label?: string;
  description?: string;
  config: Record<string, unknown>;
  durationMinutes?: number;
  weight?: number;
  weightMode?: "auto" | "manual";
  requiredPercent?: number;
  requiredPercentMode?: "auto" | "manual";
}

export interface FrozenExamInstance {
  instanceId: string;
  definitionId: ExamDefinitionId;
  legacySectionId?: SectionId;
  label: string;
  order: number;
  config: Record<string, unknown>;
  configSummary: string;
  durationMinutes: number;
  weight: number;
  requiredPercent: number;
  contentSnapshot: {
    title?: string;
    description?: string;
    items: ExamQuestion[];
  };
}

export interface ExamBlueprint {
  exams: FrozenExamInstance[];
}

export interface ExamSummaryItem {
  instanceId: string;
  definitionId: ExamDefinitionId;
  legacySectionId?: SectionId;
  label: string;
  configSummary: string;
  order: number;
  durationMinutes: number;
  weight: number;
  requiredPercent: number;
}

export interface ExamState {
  answers: Record<string, unknown>;
  remainingSeconds: number;
  earned?: number;
  possible?: number;
}

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
  stage: string | "submitted";
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
  defaultRoleId?: RoleId;
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

export interface ExamBreakdownItem {
  instanceId: string;
  definitionId: ExamDefinitionId;
  legacySectionId?: SectionId;
  label: string;
  configSummary: string;
  durationMinutes: number;
  pointsEarned: number;
  pointsPossible: number;
  percent: number;
  weightedMarksEarned: number;
  weightedMarksPossible: number;
  requiredPercent: number;
  pass: boolean;
  order: number;
}

export type ExamBreakdown = Record<string, ExamBreakdownItem>;

export interface ResultSummary {
  attemptId: string;
  candidateName?: string;
  candidateEmail?: string;
  candidateRoleId?: string;
  candidateRoleLabel?: string;
  contextType?: AssessmentContextType;
  reviewState?: ResultReviewState;
  candidateId?: string;
  candidateOwner?: string;
  candidateStage?: CandidateStage;
  candidateNextAction?: CandidateNextAction;
  candidateUiStatus?: CandidateUiStatus;
  candidateAssessmentStatus?: CandidateAssessmentStatus;
  candidateLatestActivityAt?: string;
  candidateStaleDays?: number;
  candidateNotesSummary?: string;
  submittedAt?: string;
  roleId?: string;
  coreExamRoleId?: string;
  coreExamRoleLabel?: string;
  stacks: StackId[];
  sections: SectionId[];
  exams: ExamSummaryItem[];
  corePercent: number;
  practicalPercent: number;
  finalPercent: number;
  passPercent: number;
  practicalMinPercent: number;
  pass: boolean;
  borderline: boolean;
  integrity: { tabHiddenCount: number; copyCount: number; pasteCount: number };
  sectionBreakdown: SectionBreakdown;
  examBreakdown: ExamBreakdown;
  breakdownByCategory: Record<string, { correctCount: number; totalCount: number; percent: number }>;
}

export interface ResultReviewItem {
  id: string;
  title: string;
  prompt?: string;
  promptBlocks?: PromptBlock[];
  logSnippet?: string;
  category?: string;
  formatLabel: string;
  pointsEarned: number;
  pointsPossible: number;
  status: "correct" | "partial" | "incorrect" | "unanswered";
  candidateAnswerLines: string[];
  expectedAnswerLines: string[];
  explanation?: string;
}

export interface ResultReviewSection {
  id: string;
  label: string;
  description?: string;
  configSummary?: string;
  items: ResultReviewItem[];
}

export interface DetailedResultSummary {
  summary: ResultSummary;
  reviewSections: ResultReviewSection[];
}
