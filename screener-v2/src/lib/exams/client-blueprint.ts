import type {
  CompositeSubtask,
  ExamBlueprint,
  ExamQuestion,
  LogicReasoningQuestion,
  PracticalTaskQuestion,
  Question
} from "@/lib/assessment-engine/types";
import { summarizeExamInstance } from "@/lib/exams/catalog";

function sanitizeCoreQuestion(question: Question): Question {
  switch (question.format) {
    case "ordering":
      return {
        ...question,
        correctOrder: [],
        explanation: "",
        rationale: ""
      };
    case "matching":
    case "scenario_mapping":
      return {
        ...question,
        correctPairs: {},
        explanation: "",
        rationale: ""
      };
    case "fill_blank_constrained":
      return {
        ...question,
        acceptedAnswers: [],
        explanation: "",
        rationale: ""
      };
    default:
      return {
        ...question,
        correctAnswer: [],
        explanation: "",
        rationale: ""
      };
  }
}

function sanitizeCompositeSubtask(task: CompositeSubtask): CompositeSubtask {
  if (task.type === "matching") {
    return {
      ...task,
      expected: {}
    };
  }

  return {
    ...task,
    expected: ""
  };
}

function sanitizeCompositeQuestion(
  question: PracticalTaskQuestion | LogicReasoningQuestion
): PracticalTaskQuestion | LogicReasoningQuestion {
  return {
    ...question,
    subtasks: question.subtasks.map(sanitizeCompositeSubtask)
  };
}

function sanitizeExamQuestion(question: ExamQuestion): ExamQuestion {
  if (question.format === "practical_task" || question.format === "logic_reasoning") {
    return sanitizeCompositeQuestion(question);
  }

  return sanitizeCoreQuestion(question);
}

export function sanitizeBlueprintForClient(blueprint: ExamBlueprint): ExamBlueprint {
  return {
    exams: blueprint.exams.map((exam) => ({
      ...exam,
      contentSnapshot: {
        ...exam.contentSnapshot,
        items: exam.contentSnapshot.items.map(sanitizeExamQuestion)
      }
    }))
  };
}

export function summarizeBlueprintForClient(blueprint: ExamBlueprint) {
  return blueprint.exams.map(summarizeExamInstance);
}
