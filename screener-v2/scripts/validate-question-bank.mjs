import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const config = JSON.parse(fs.readFileSync(path.join(cwd, "src", "lib", "data", "config-v2.json"), "utf8"));
const bank = JSON.parse(fs.readFileSync(path.join(cwd, "src", "lib", "data", "question-bank.json"), "utf8"));

const roleOrder = config.canonicalRoleOrder;
const validRoles = new Set(roleOrder);
const validStacks = new Set(["General", ...config.stacks]);
const validFormats = new Set(config.validFormats);
const validScoring = new Set(config.validScoringMethods);
const validCategories = new Set(config.validCategories);

const errors = [];
const warnings = [];
const seenIds = new Set();

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function roleAllows(question, roleId, stacks) {
  const current = roleOrder.indexOf(roleId);
  const min = roleOrder.indexOf(question.role_level_min);
  const max = question.role_level_max ? roleOrder.indexOf(question.role_level_max) : Number.POSITIVE_INFINITY;
  if (current < min || current > max) return false;
  if (question.senior_only && current < roleOrder.indexOf("SeniorSE")) return false;
  if (question.lead_only && roleId !== "TechLead") return false;
  if (question.tech_stack === "General") return true;
  return stacks.includes(question.tech_stack);
}

function nonExclusive(question) {
  return !question.senior_only && !question.lead_only;
}

for (const question of bank) {
  if (!hasText(question.id)) errors.push("Question with missing id.");
  if (seenIds.has(question.id)) errors.push(`Duplicate id: ${question.id}`);
  seenIds.add(question.id);

  if (!validRoles.has(question.role_level_min)) errors.push(`${question.id}: invalid role_level_min '${question.role_level_min}'.`);
  if (question.role_level_max && !validRoles.has(question.role_level_max)) {
    errors.push(`${question.id}: invalid role_level_max '${question.role_level_max}'.`);
  }
  if (!validStacks.has(question.tech_stack)) errors.push(`${question.id}: invalid tech_stack '${question.tech_stack}'.`);
  if (!validCategories.has(question.category)) errors.push(`${question.id}: invalid category '${question.category}'.`);
  if (!validFormats.has(question.format)) errors.push(`${question.id}: invalid format '${question.format}'.`);
  if (!validScoring.has(question.scoring_method)) {
    errors.push(`${question.id}: invalid scoring_method '${question.scoring_method}'.`);
  }
  if (!Number.isInteger(question.difficulty) || question.difficulty < 1 || question.difficulty > 5) {
    errors.push(`${question.id}: difficulty must be an integer from 1 to 5.`);
  }
  if (!hasText(question.question_text)) errors.push(`${question.id}: missing question_text.`);
  if (!hasText(question.explanation)) errors.push(`${question.id}: missing explanation.`);
  if (!hasText(question.rationale)) errors.push(`${question.id}: missing rationale.`);

  if (["single_choice", "best_next_step", "log_analysis_single_choice", "trace_execution", "case_triage"].includes(question.format)) {
    if (!Array.isArray(question.options) || question.options.length < 2) {
      errors.push(`${question.id}: choice-style formats require at least 2 options.`);
    }
    if (!Array.isArray(question.correct_answer) || question.correct_answer.length < 1) {
      errors.push(`${question.id}: choice-style formats require correct_answer.`);
    }
  }

  if (question.format === "multi_select") {
    if (!Array.isArray(question.options) || question.options.length < 2) {
      errors.push(`${question.id}: multi_select requires options.`);
    }
    if (!Array.isArray(question.correct_answer) || question.correct_answer.length < 2) {
      warnings.push(`${question.id}: multi_select has fewer than 2 correct answers.`);
    }
  }

  if (question.format === "ordering") {
    if (!Array.isArray(question.items) || !Array.isArray(question.correct_order) || question.items.length !== question.correct_order.length) {
      errors.push(`${question.id}: ordering requires matching items and correct_order lengths.`);
    }
  }

  if (question.format === "match_pairs") {
    if (!Array.isArray(question.left_items) || !Array.isArray(question.right_items) || !question.correct_pairs) {
      errors.push(`${question.id}: match_pairs requires left_items, right_items, and correct_pairs.`);
    }
  }

  if (question.format === "fill_in_blank_constrained") {
    if (!hasText(question.blank)) errors.push(`${question.id}: fill_in_blank_constrained requires blank.`);
    if (!Array.isArray(question.choices) || question.choices.length < 2) {
      errors.push(`${question.id}: fill_in_blank_constrained requires choices.`);
    }
    if (!Array.isArray(question.accepted_answers) || question.accepted_answers.length < 1) {
      errors.push(`${question.id}: fill_in_blank_constrained requires accepted_answers.`);
    }
  }
}

for (const [roleId, roleConfig] of Object.entries(config.roles)) {
  const eligible = bank.filter((question) => roleAllows(question, roleId, config.stacks));
  const nonExclusiveEligible = eligible.filter(nonExclusive);
  const generalCount = nonExclusiveEligible.filter((question) => question.tech_stack === "General").length;
  const stackCount = nonExclusiveEligible.filter((question) => question.tech_stack !== "General").length;
  const logCount = eligible.filter((question) => question.format === "log_analysis_single_choice").length;

  if (eligible.length < roleConfig.question_count) {
    errors.push(`${roleId}: eligible pool shortage ${eligible.length}/${roleConfig.question_count}.`);
  }
  if (generalCount < roleConfig.general_minimum) {
    errors.push(`${roleId}: general minimum shortage ${generalCount}/${roleConfig.general_minimum}.`);
  }
  if (stackCount < roleConfig.stack_minimum) {
    errors.push(`${roleId}: stack minimum shortage ${stackCount}/${roleConfig.stack_minimum}.`);
  }
  if (logCount < roleConfig.log_analysis_minimum) {
    errors.push(`${roleId}: log-analysis shortage ${logCount}/${roleConfig.log_analysis_minimum}.`);
  }
}

if (errors.length) {
  console.error("Question bank validation failed.");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Question bank validation passed for ${bank.length} questions.`);
for (const warning of warnings) console.warn(`Warning: ${warning}`);
