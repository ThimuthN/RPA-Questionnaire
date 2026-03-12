
(function () {
  "use strict";

  const C2 = window.ASSESSMENT_CONFIG_V2 || null;
  const C1 = window.ASSESSMENT_CONFIG || {};
  const HAS_BANK_ARRAY = Array.isArray(window.QUESTION_BANK);
  const RAW = HAS_BANK_ARRAY ? window.QUESTION_BANK : [];
  if (!C2) {
    document.body.innerHTML = "<p>Missing config.js.</p>";
    return;
  }
  if (!HAS_BANK_ARRAY || RAW.length === 0) {
    document.body.innerHTML = "<p>Question bank failed to load. Check questions.js for syntax errors.</p>";
    return;
  }

  const ROLE_ORDER = Array.isArray(C2.canonicalRoleOrder) ? C2.canonicalRoleOrder.slice() : ["Intern", "Associate", "SE", "SeniorSE", "TechLead"];
  const STACKS = Array.isArray(C2.stacks) ? C2.stacks.slice() : ["UiPath", "AutomationAnywhere", "Python", "PowerAutomate"];
  const STACK_LABELS = C2.stackLabels || {};
  const STACK_REQUIRED = C2.stackSelectionRequired !== false;
  const HAS_STACK_SPECIFIC_QUESTIONS = RAW.some((q) => q && q.tech_stack && q.tech_stack !== "General");
  const ROLE_IDS = ROLE_ORDER.filter((r) => C2.roles && C2.roles[r]);
  const DEFAULT_ROLE = ROLE_IDS.includes(C2.defaultRoleId) ? C2.defaultRoleId : ROLE_IDS[0];
  const VALID_FORMATS = new Set(C2.validFormats || []);
  const VALID_CATEGORIES = new Set(C2.validCategories || []);
  const VALID_SCORING = new Set(C2.validScoringMethods || []);

  const LEGACY_CAT = {
    exception_handling: "Exception Handling & Retries",
    retry_boundaries: "Exception Handling & Retries",
    idempotency_rerun: "Data Handling & Validation",
    logging_observability: "Debugging & Logs",
    scalability_rate_limits: "Performance & Stability",
    queues_transactions: "Queues / Work Items"
  };
  const LEGACY_DIFF = { easy: 2, medium: 3, hard: 4 };
  const DIFF_TIME = { 1: 60, 2: 90, 3: 120, 4: 135, 5: 150 };

  const S = {
    storage: false,
    attempt: null,
    result: null,
    diag: null,
    selectedRole: DEFAULT_ROLE || "",
    selectedStacks: [],
    saveTimer: null,
    savedAt: null,
    tick: null,
    modalResolve: null,
    hiddenAt: null,
    autoSubmitting: false
  };

  const E = {};
  function id(x) { return document.getElementById(x); }
  function toInt(v, d) { const n = Number(v); return Number.isFinite(n) ? Math.floor(n) : d; }
  function toNum(v, d) { const n = Number(v); return Number.isFinite(n) ? n : d; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function esc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;"); }
  function roleIndex(r) { return ROLE_ORDER.indexOf(r); }
  function roleLabel(r) { const x = (C2.roles || {})[r]; return x ? (x.label || r) : (r || "-"); }
  function stackLabel(s) { return STACK_LABELS[s] || String(s || ""); }
  function formatLabel(f) {
    const map = {
      single_choice: "Single Choice",
      best_next_step: "Best Next Step",
      multi_select: "Multi Select",
      ordering: "Ordering",
      log_analysis_single_choice: "Log Analysis",
      trace_execution: "Trace Execution",
      fill_in_blank_constrained: "Fill in Blank",
      match_pairs: "Match Pairs",
      case_triage: "Case Triage"
    };
    return map[f] || String(f || "-");
  }
  function promptHintByFormat(q) {
    const f = q && q.format;
    if (f === "trace_execution") return "Use the sequence to decide the final status.";
    if (f === "log_analysis_single_choice") return "Base your answer only on the log evidence shown.";
    if (f === "multi_select") return "Select all correct options; guessing extra options can reduce score.";
    if (f === "ordering") return "Arrange steps in the safest production order.";
    if (f === "match_pairs" || (f === "case_triage" && q && q.case_triage_variant === "match_pairs")) return "Match each item once to the best matching category or action.";
    if (f === "fill_in_blank_constrained") return "Pick the most precise term from the provided choices.";
    if (f === "best_next_step") return "Choose the highest-impact next action under the stated constraints.";
    if (f === "case_triage") return "Prioritize the first action that reduces operational risk most.";
    return "";
  }
  function splitPlainPrompt(raw) {
    const text = String(raw || "").replace(/\s+/g, " ").trim();
    if (!text) return { scenario: "", constraint: "", question: "" };

    const sentences = text.split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter(Boolean);
    const scenarioParts = [];
    const constraintParts = [];
    let question = "";

    const questionMarker = /^(Question:\s*)?(what|which|select|choose|match|order|fill|best|final|put|place)\b/i;
    const constraintMarker = /^(Constraint:\s*)|(\bcannot\b|\bcan't\b|\bmust\b|\bwithout\b|\bblocked\b|\bnot allowed\b|\bupstream\b)/i;

    for (let i = 0; i < sentences.length; i += 1) {
      const sentence = sentences[i];
      if (!question && (sentence.includes("?") || questionMarker.test(sentence))) {
        question = sentence.replace(/^Question:\s*/i, "").trim();
        continue;
      }
      if (constraintMarker.test(sentence)) {
        constraintParts.push(sentence.replace(/^Constraint:\s*/i, "").trim());
        continue;
      }
      scenarioParts.push(sentence.replace(/^Scenario:\s*/i, "").trim());
    }

    if (!question && sentences.length > 1) {
      question = sentences[sentences.length - 1].replace(/^Question:\s*/i, "").trim();
      if (!scenarioParts.length) scenarioParts.push(...sentences.slice(0, -1));
    }
    if (!question) question = "Choose the best option.";
    if (!scenarioParts.length) {
      const remainder = text.replace(question, "").trim();
      if (remainder) scenarioParts.push(remainder);
    }

    return {
      scenario: scenarioParts.join(" ").replace(/\s+/g, " ").trim(),
      constraint: constraintParts.join(" ").replace(/\s+/g, " ").trim(),
      question
    };
  }
  function promptHtml(text, q) {
    const raw = String(text || "")
      .replace(/\s+(Constraint|Goal|Objective|Task|Question|Answering guidance|Success criteria|What matters most):/gi, "\n$1:")
      .replace(/\s+(Operating context|Context|Scenario):/gi, "\n$1:");
    const lines = raw.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    if (!lines.length) return "";
    const hasLabeledLines = lines.some((line) => /^(Context|Operating context|Scenario|Constraint|Goal|Objective|Task|Question|Answering guidance|Success criteria|What matters most|Categories|Items|Terms|Examples|Options):/i.test(line));
    const row = (label, value) => '<div class="prompt-line"><strong>' + esc(label) + '</strong> ' + esc(value) + "</div>";
    if (!hasLabeledLines) {
      const split = splitPlainPrompt(lines.join(" "));
      const out = [];
      if (split.scenario) out.push(row("Scenario:", split.scenario));
      if (split.constraint) out.push(row("Constraint:", split.constraint));
      if (split.question) out.push(row("Question:", split.question));
      const hint = promptHintByFormat(q);
      if (hint) out.push(row("How to Answer:", hint));
      return out.join("");
    }
    return lines.map((line) => {
      if (/^Context:/i.test(line)) return row("Context:", line.replace(/^Context:\s*/i, ""));
      if (/^Operating context:/i.test(line)) return row("Operating Context:", line.replace(/^Operating context:\s*/i, ""));
      if (/^Scenario:/i.test(line)) return row("Scenario:", line.replace(/^Scenario:\s*/i, ""));
      if (/^Constraint:/i.test(line)) return row("Constraint:", line.replace(/^Constraint:\s*/i, ""));
      if (/^Goal:/i.test(line)) return row("Goal:", line.replace(/^Goal:\s*/i, ""));
      if (/^Objective:/i.test(line)) return row("Objective:", line.replace(/^Objective:\s*/i, ""));
      if (/^Task:/i.test(line)) return row("Task:", line.replace(/^Task:\s*/i, ""));
      if (/^Question:/i.test(line)) return row("Question:", line.replace(/^Question:\s*/i, ""));
      if (/^Answering guidance:/i.test(line)) return row("Answering Guidance:", line.replace(/^Answering guidance:\s*/i, ""));
      if (/^Success criteria:/i.test(line)) return row("Success Criteria:", line.replace(/^Success criteria:\s*/i, ""));
      if (/^What matters most:/i.test(line)) return row("What Matters Most:", line.replace(/^What matters most:\s*/i, ""));
      if (/^Categories:/i.test(line)) return row("Categories:", line.replace(/^Categories:\s*/i, ""));
      if (/^Items:/i.test(line)) return row("Items:", line.replace(/^Items:\s*/i, ""));
      if (/^Terms:/i.test(line)) return row("Terms:", line.replace(/^Terms:\s*/i, ""));
      if (/^Examples:/i.test(line)) return row("Examples:", line.replace(/^Examples:\s*/i, ""));
      if (/^Options:/i.test(line)) return row("Options:", line.replace(/^Options:\s*/i, ""));
      return '<div class="prompt-line">' + esc(line) + "</div>";
    }).join("");
  }
  function seq(n) { return Array.from({ length: Math.max(0, n) }, (_, i) => i); }
  function addCount(m, k, n) { m[k] = (m[k] || 0) + (n || 1); }
  function sumMap(m) { return Object.keys(m || {}).reduce((a, k) => a + Math.max(0, toInt(m[k], 0)), 0); }
  function fmtClock(s) { const x = Math.max(0, toInt(s, 0)); const m = Math.floor(x / 60); const r = x % 60; return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0"); }
  function fmtDate(iso) { if (!iso) return "-"; const d = new Date(iso); return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString(); }
  function slug(v) { return String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "role"; }

  function parseSeed(v) { if (v == null) return null; const t = String(v).trim(); return /^\d+$/.test(t) ? (Number(t) >>> 0) : null; }
  function seedFromUrl() {
    const q = parseSeed(new URLSearchParams(location.search).get("seed"));
    if (q !== null) return q;
    const h = String(location.hash || "").replace(/^#/, "");
    const m = h.match(/(?:^|[?&])seed=(\d+)/i) || h.match(/^seed=(\d+)$/i);
    return m ? parseSeed(m[1]) : null;
  }
  function makeSeed() { if (window.crypto && window.crypto.getRandomValues) { const a = new Uint32Array(1); window.crypto.getRandomValues(a); return a[0] >>> 0; } return (Math.floor(Math.random() * 0xffffffff) >>> 0); }
  function hashSeed(s) { let h = 2166136261; const t = String(s || ""); for (let i = 0; i < t.length; i += 1) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let t = seed >>> 0; return function () { t += 0x6d2b79f5; let x = t; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(a, r) { for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function defaultPoints(d) { const x = clamp(toInt(d, 2), 1, 5); if (x <= 2) return 1; if (x === 3) return 2; if (x === 4) return 3; return 4; }
  function defaultScoring(f, q) {
    if (f === "multi_select") return "partial_with_penalty";
    if (f === "ordering") return "partial_position";
    if (f === "match_pairs") return "partial_pairs_with_penalty";
    if (f === "case_triage" && q && q.case_triage_variant === "match_pairs") return "partial_pairs_with_penalty";
    return "all_or_nothing";
  }
  function normDiff(v) { const n = toInt(v, NaN); if (Number.isInteger(n) && n >= 1 && n <= 5) return n; if (typeof v === "string" && LEGACY_DIFF[v]) return LEGACY_DIFF[v]; return 2; }

  function normalizeBank() {
    const questions = []; const errors = []; const warnings = []; const seen = new Set();
    RAW.forEach((raw, i) => {
      if (!raw || typeof raw !== "object") { warnings.push({ code: "MISSING_REQUIRED_FIELD", message: "Index " + i + " skipped: invalid object." }); return; }
      const q = normalizeQuestion(raw, warnings);
      if (!q) return;
      if (seen.has(q.id)) { errors.push({ code: "DUPLICATE_ID", message: "Duplicate id: " + q.id + "." }); return; }
      seen.add(q.id);
      const v = validateQuestion(q);
      v.errors.forEach((m) => errors.push({ code: "SCHEMA_INVALID", message: q.id + ": " + m }));
      v.warnings.forEach((m) => warnings.push({ code: "SCHEMA_WARN", message: q.id + ": " + m }));
      questions.push(q);
    });
    return { questions, errors, warnings };
  }

  function normalizeQuestion(raw, warnings) {
    const idValue = String(raw.id || "").trim();
    if (!idValue) return null;
    const isV2 = !!(raw.format || raw.question_text || raw.role_level_min || raw.tech_stack);
    if (isV2) {
      const q = {
        id: idValue,
        role_level_min: ROLE_IDS.includes(raw.role_level_min) ? raw.role_level_min : "Intern",
        role_level_max: raw.role_level_max == null ? null : (ROLE_IDS.includes(raw.role_level_max) ? raw.role_level_max : null),
        senior_only: !!raw.senior_only,
        lead_only: !!raw.lead_only,
        tech_stack: (["General"].concat(STACKS)).includes(raw.tech_stack) ? raw.tech_stack : "General",
        category: String(raw.category || ""),
        difficulty: normDiff(raw.difficulty),
        format: String(raw.format || ""),
        points: toNum(raw.points, NaN),
        time_estimate_seconds: toNum(raw.time_estimate_seconds, NaN),
        question_text: String(raw.question_text || raw.prompt || ""),
        options: Array.isArray(raw.options) ? raw.options.slice() : undefined,
        correct_answer: Array.isArray(raw.correct_answer) ? raw.correct_answer.slice() : undefined,
        scoring_method: String(raw.scoring_method || ""),
        explanation: String(raw.explanation || ""),
        rationale: String(raw.rationale || ""),
        log_snippet: raw.log_snippet ? String(raw.log_snippet) : undefined,
        items: Array.isArray(raw.items) ? raw.items.slice() : undefined,
        correct_order: Array.isArray(raw.correct_order) ? raw.correct_order.slice() : undefined,
        left_items: Array.isArray(raw.left_items) ? raw.left_items.slice() : undefined,
        right_items: Array.isArray(raw.right_items) ? raw.right_items.slice() : undefined,
        correct_pairs: raw.correct_pairs && typeof raw.correct_pairs === "object" ? clone(raw.correct_pairs) : undefined,
        blank: raw.blank == null ? undefined : String(raw.blank),
        choices: Array.isArray(raw.choices) ? raw.choices.slice() : undefined,
        accepted_answers: Array.isArray(raw.accepted_answers) ? raw.accepted_answers.slice() : undefined,
        case_triage_variant: raw.case_triage_variant ? String(raw.case_triage_variant) : undefined
      };
      const inferred = [];
      if (!Number.isFinite(q.points) || q.points <= 0) { q.points = defaultPoints(q.difficulty); inferred.push("points"); }
      if (!Number.isFinite(q.time_estimate_seconds) || q.time_estimate_seconds <= 0) { q.time_estimate_seconds = DIFF_TIME[q.difficulty] || 90; inferred.push("time_estimate_seconds"); }
      if (!q.scoring_method || !VALID_SCORING.has(q.scoring_method)) { q.scoring_method = defaultScoring(q.format, q); inferred.push("scoring_method"); }
      if (!q.rationale) { q.rationale = "Evaluates practical RPA capability."; inferred.push("rationale"); }
      if (inferred.length) warnings.push({ code: "MIGRATION_DEFAULT_APPLIED", message: q.id + ": inferred " + inferred.join(", ") + "." });
      return q;
    }

    const format = String(raw.type || "single_choice");
    const difficulty = normDiff(raw.difficulty);
    const points = toNum((C1.scoringPointsByType || {})[format], defaultPoints(difficulty));
    const qLegacy = {
      id: idValue,
      role_level_min: "Intern",
      role_level_max: "SE",
      senior_only: false,
      lead_only: false,
      tech_stack: "General",
      category: LEGACY_CAT[String(raw.category || "")] || "Core RPA Concepts",
      difficulty,
      format,
      points,
      time_estimate_seconds: DIFF_TIME[difficulty] || 90,
      question_text: String(raw.prompt || ""),
      options: Array.isArray(raw.options) ? raw.options.slice() : undefined,
      correct_answer: [],
      scoring_method: defaultScoring(format),
      explanation: String(raw.explanation || ""),
      rationale: "Legacy question normalized to v2."
    };
    if (format === "single_choice" || format === "log_analysis_single_choice") {
      const idx = raw.correct && Number.isInteger(raw.correct.optionIndex) ? raw.correct.optionIndex : -1;
      if (idx >= 0) qLegacy.correct_answer = [String.fromCharCode(65 + idx)];
    } else if (format === "multi_select") {
      const idxs = Array.isArray(raw.correct && raw.correct.optionIndices) ? raw.correct.optionIndices : [];
      qLegacy.correct_answer = idxs.map((x) => String.fromCharCode(65 + x));
      qLegacy.scoring_method = "all_or_nothing";
    } else if (format === "ordering") {
      qLegacy.items = Array.isArray(raw.orderingItems) ? raw.orderingItems.slice() : [];
      qLegacy.correct_order = Array.isArray(raw.correct && raw.correct.orderIndices) ? raw.correct.orderIndices.slice() : [];
      qLegacy.correct_answer = qLegacy.correct_order.map(String);
      qLegacy.scoring_method = "partial_position";
    }
    warnings.push({ code: "MIGRATION_DEFAULT_APPLIED", message: qLegacy.id + ": legacy normalized." });
    return qLegacy;
  }

  function validateQuestion(q) {
    const errors = []; const warnings = [];
    if (!ROLE_IDS.includes(q.role_level_min)) errors.push("invalid role_level_min");
    if (q.role_level_max !== null && !ROLE_IDS.includes(q.role_level_max)) errors.push("invalid role_level_max");
    if (!(["General"].concat(STACKS)).includes(q.tech_stack)) errors.push("invalid tech_stack");
    if (!VALID_CATEGORIES.has(q.category)) errors.push("invalid category");
    if (!VALID_FORMATS.has(q.format)) errors.push("invalid format");
    if (!Number.isInteger(q.difficulty) || q.difficulty < 1 || q.difficulty > 5) errors.push("invalid difficulty");
    if (!q.question_text) errors.push("missing question_text");
    if (!VALID_SCORING.has(q.scoring_method)) errors.push("invalid scoring_method");
    if (!q.explanation) warnings.push("missing explanation");

    const choiceLike = ["single_choice", "best_next_step", "log_analysis_single_choice", "trace_execution"].includes(q.format) || (q.format === "case_triage" && q.case_triage_variant !== "match_pairs");
    if (choiceLike) {
      if (!Array.isArray(q.options) || q.options.length < 2) errors.push("options required");
      if (!Array.isArray(q.correct_answer) || !q.correct_answer.length) errors.push("correct_answer required");
    }
    if (q.format === "multi_select") {
      if (!Array.isArray(q.options) || q.options.length < 2) errors.push("multi_select options required");
      if (!Array.isArray(q.correct_answer) || !q.correct_answer.length) errors.push("multi_select correct_answer required");
    }
    if (q.format === "ordering") {
      if (!Array.isArray(q.items) || q.items.length < 2) errors.push("ordering items required");
      if (!Array.isArray(q.correct_order) || q.correct_order.length !== q.items.length) errors.push("ordering correct_order required");
    }
    const pairLike = q.format === "match_pairs" || (q.format === "case_triage" && q.case_triage_variant === "match_pairs");
    if (pairLike) {
      if (!Array.isArray(q.left_items) || q.left_items.length < 2) errors.push("left_items required");
      if (!Array.isArray(q.right_items) || q.right_items.length < 2) errors.push("right_items required");
      if (!q.correct_pairs || typeof q.correct_pairs !== "object") errors.push("correct_pairs required");
    }
    if (q.format === "fill_in_blank_constrained") {
      if (!Array.isArray(q.choices) || q.choices.length < 2) errors.push("choices required");
      if (!Array.isArray(q.accepted_answers) || !q.accepted_answers.length) errors.push("accepted_answers required");
    }
    return { errors, warnings };
  }

  const NB = normalizeBank();
  const BANK = NB.questions;
  const QMAP = new Map(BANK.map((q) => [q.id, q]));

  function cache() {
    E.views = { landing: id("view-landing"), assessment: id("view-assessment"), results: id("view-results"), diagnostics: id("view-diagnostics") };
    E.landingTitle = id("landing-title"); E.landingRules = id("landing-rules"); E.roleSelect = id("role-select"); E.stackPicker = id("stack-picker"); E.stackLabel = id("stack-label"); E.stackOptions = id("stack-options"); E.stackSummary = id("stack-summary"); E.roleSummary = id("role-summary"); E.practiceToggle = id("practice-toggle"); E.adminOverrideWrap = id("admin-override-wrap"); E.adminOverrideToggle = id("admin-override-toggle"); E.startBtn = id("start-btn"); E.resumeBtn = id("resume-btn"); E.resumeCard = id("resume-card"); E.resumeSummary = id("resume-summary"); E.openDiagnosticsBtn = id("open-diagnostics-btn"); E.landingError = id("landing-error"); E.storageWarning = id("storage-warning"); E.diagnosticsStatus = id("diagnostics-status");
    E.assessmentContext = id("assessment-context"); E.timerLabel = id("timer-label"); E.progressLabel = id("progress-label"); E.answeredLabel = id("answered-label"); E.answeredProgressBar = id("answered-progress-bar"); E.autosaveIndicator = id("autosave-indicator"); E.submitBtn = id("submit-btn"); E.timeupBanner = id("timeup-banner"); E.questionTitle = id("question-title"); E.questionMeta = id("question-meta"); E.questionPrompt = id("question-prompt"); E.questionLog = id("question-log"); E.questionLogCode = E.questionLog ? E.questionLog.querySelector("code") : null; E.answerContainer = id("answer-container"); E.practiceTools = id("practice-tools"); E.checkAnswerBtn = id("check-answer-btn"); E.practiceFeedback = id("practice-feedback"); E.prevBtn = id("prev-btn"); E.nextBtn = id("next-btn"); E.questionGrid = id("question-grid");
    E.resultPercent = id("result-percent"); E.resultPoints = id("result-points"); E.resultPassBadge = id("result-pass-badge"); E.resultTime = id("result-time"); E.resultRole = id("result-role"); E.resultStacks = id("result-stacks"); E.resultPassTarget = id("result-pass-target"); E.resultOverride = id("result-override"); E.resultSeed = id("result-seed"); E.resultStart = id("result-start"); E.resultEnd = id("result-end"); E.attentionPanel = id("attention-panel"); E.attentionTabHidden = id("attention-tab-hidden"); E.attentionTabHiddenSeconds = id("attention-tab-hidden-seconds"); E.attentionCopy = id("attention-copy"); E.attentionPaste = id("attention-paste"); E.breakdownBody = id("breakdown-body"); E.reviewList = id("review-list"); E.downloadJsonBtn = id("download-json-btn"); E.copyJsonBtn = id("copy-json-btn"); E.downloadCsvBtn = id("download-csv-btn"); E.startNewBtn = id("start-new-btn");
    E.diagRoleMeta = id("diag-role-meta"); E.diagTotalQuestions = id("diag-total-questions"); E.diagCategoryBody = id("diag-category-body"); E.diagTypeBody = id("diag-type-body"); E.diagStackBody = id("diag-stack-body"); E.diagDifficultyBody = id("diag-difficulty-body"); E.diagRequirementBody = id("diag-requirement-body"); E.diagErrors = id("diag-errors"); E.diagWarnings = id("diag-warnings"); E.exportTemplateBtn = id("export-template-btn"); E.diagBackBtn = id("diag-back-btn");
    E.modalBackdrop = id("modal-backdrop"); E.modalTitle = id("modal-title"); E.modalMessage = id("modal-message"); E.modalConfirm = id("modal-confirm"); E.modalCancel = id("modal-cancel");
  }
  function show(view) { Object.keys(E.views).forEach((k) => E.views[k].classList.toggle("hidden", k !== view)); }

  function testStorage() {
    try { const k = "__rpa_v2_test__"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return true; } catch (e) { return false; }
  }
  function saveSoon() { if (!S.storage) return; if (S.saveTimer) clearTimeout(S.saveTimer); S.saveTimer = setTimeout(saveNow, 180); }
  function saveNow() {
    if (!S.storage) return;
    if (S.saveTimer) { clearTimeout(S.saveTimer); S.saveTimer = null; }
    try {
      localStorage.setItem(C2.localStorageKey, JSON.stringify({ attempt: S.attempt, result: S.result }));
      S.savedAt = Date.now();
      if (S.attempt && S.attempt.status === "in_progress" && E.autosaveIndicator) E.autosaveIndicator.textContent = "Saved " + new Date(S.savedAt).toLocaleTimeString([], { hour12: false });
    } catch (e) {
      S.storage = false;
      E.storageWarning.textContent = "LocalStorage write failed. Continuing without autosave.";
      E.storageWarning.classList.remove("hidden");
    }
  }
  function loadState() {
    if (!S.storage) return;
    try {
      const raw = localStorage.getItem(C2.localStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.attempt) S.attempt = parsed.attempt;
      if (parsed && parsed.result) S.result = parsed.result;
      if (!S.attempt) return;
      if (!Array.isArray(S.attempt.selectedQuestions)) throw new Error("invalid state");
      if (!S.attempt.selectedQuestions.length) throw new Error("empty attempt state");
      if (S.attempt.selectedQuestions.some((m) => !QMAP.has(m.id))) throw new Error("question mismatch");
      S.attempt.answers = S.attempt.answers || {};
      S.attempt.checkedQuestions = S.attempt.checkedQuestions || {};
      S.attempt.selectedStacks = Array.isArray(S.attempt.selectedStacks) ? S.attempt.selectedStacks.filter((s) => STACKS.includes(s)) : [];
      S.attempt.attention = S.attempt.attention || { tabHiddenCount: 0, tabHiddenSeconds: 0, copyEventCount: 0, pasteEventCount: 0 };
      if (ROLE_IDS.includes(S.attempt.roleId)) S.selectedRole = S.attempt.roleId;
      if (S.attempt.selectedStacks.length) S.selectedStacks = S.attempt.selectedStacks.slice();
      const n = S.attempt.selectedQuestions.length;
      S.attempt.currentIndex = clamp(toInt(S.attempt.currentIndex, 0), 0, Math.max(0, n - 1));
      if (S.attempt.status === "in_progress" && S.attempt.mode === "assessment") {
        const now = Date.now();
        const last = toNum(S.attempt.lastUpdatedAt, now);
        const dt = Math.max(0, Math.floor((now - last) / 1000));
        S.attempt.remainingSeconds = Math.max(0, toInt(S.attempt.remainingSeconds, 0) - dt);
        S.attempt.lastUpdatedAt = now;
      }
    } catch (e) {
      S.attempt = null; S.result = null;
      try { localStorage.removeItem(C2.localStorageKey); } catch (ignore) {}
    }
  }
  function clearAll() {
    stopTimer();
    S.attempt = null; S.result = null; S.savedAt = null; S.hiddenAt = null; S.autoSubmitting = false;
    if (S.saveTimer) { clearTimeout(S.saveTimer); S.saveTimer = null; }
    if (S.storage) { try { localStorage.removeItem(C2.localStorageKey); } catch (ignore) {} }
  }

  function isSelectableQuestion(q) { return !String((q || {}).id || "").startsWith("LEG-"); }
  function allowedForRole(q, roleId, stacks) {
    const cur = roleIndex(roleId);
    const min = roleIndex(q.role_level_min);
    const max = q.role_level_max == null ? Infinity : roleIndex(q.role_level_max);
    if (min < 0 || max < 0 || cur < min || cur > max) return false;
    if (q.senior_only && cur < roleIndex("SeniorSE")) return false;
    if (q.lead_only && roleId !== "TechLead") return false;
    return q.tech_stack === "General" || stacks.includes(q.tech_stack);
  }
  function buildQuotaPlan(role, stacks) {
    const questionCount = Math.max(0, toInt(role.question_count, 0));
    const generalMinimum = Math.max(0, toInt(role.general_minimum, 0));
    const stackMinimum = Math.max(0, toInt(role.stack_minimum, 0));
    const seniorOnlyMinimum = Math.max(0, toInt(role.senior_only_minimum, 0));
    const leadOnlyMinimum = Math.max(0, toInt(role.lead_only_minimum, 0));
    const nonExclusiveTarget = Math.max(0, questionCount - seniorOnlyMinimum - leadOnlyMinimum);
    const selected = STACKS.filter((s) => stacks.includes(s));
    const stackQuotas = {};
    if (selected.length) {
      const base = Math.floor(stackMinimum / selected.length);
      let rem = stackMinimum - (base * selected.length);
      selected.forEach((s) => { stackQuotas[s] = base; });
      for (let i = 0; i < selected.length && rem > 0; i += 1) {
        stackQuotas[selected[i]] += 1;
        rem -= 1;
      }
    }
    return {
      questionCount,
      generalMinimum,
      stackMinimum,
      seniorOnlyMinimum,
      leadOnlyMinimum,
      nonExclusiveTarget,
      selectedStacks: selected,
      stackQuotas
    };
  }
  function buildQuotas(role, stacks, warnings) {
    const plan = buildQuotaPlan(role, stacks);
    if (Array.isArray(warnings) && (plan.generalMinimum + plan.stackMinimum !== plan.nonExclusiveTarget)) {
      warnings.push({ code: "ROLE_BLUEPRINT_TOTAL_MISMATCH", message: "Warning: general minimum and stack minimum do not align with non-exclusive target." });
    }
    return clone(plan);
  }
  function dedupeIssues(arr) {
    const out = [], seen = new Set();
    arr.forEach((x) => { const key = String((x || {}).code || "") + "|" + String((x || {}).message || ""); if (seen.has(key)) return; seen.add(key); out.push({ code: String((x || {}).code || "ISSUE"), message: String((x || {}).message || "") }); });
    return out;
  }
  function normPrompt(text) { return String(text || "").toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9\s]/g, "").trim(); }
  function detectNearDuplicates(questions) {
    const warnings = [];
    const seen = new Map();
    (questions || []).forEach((q) => {
      const key = normPrompt(q.question_text).slice(0, 140);
      if (!key) return;
      const arr = seen.get(key) || [];
      arr.push(q.id);
      seen.set(key, arr);
    });
    seen.forEach((ids) => {
      if (ids.length > 1) warnings.push({ code: "NEAR_DUPLICATE_PROMPT", message: "Warning: many questions have similar wording; review recommended (" + ids.slice(0, 6).join(", ") + ")." });
    });
    return warnings;
  }
  function detectAnswerKeySkew(questions) {
    const warnings = [];
    const counts = {};
    let total = 0;
    (questions || []).forEach((q) => {
      const choiceLike = ["single_choice", "best_next_step", "log_analysis_single_choice", "trace_execution"].includes(q.format) || (q.format === "case_triage" && q.case_triage_variant !== "match_pairs");
      if (!choiceLike) return;
      if (!Array.isArray(q.correct_answer) || !q.correct_answer.length) return;
      const token = String(q.correct_answer[0] || "").trim().toUpperCase();
      if (!/^[A-Z]$/.test(token)) return;
      counts[token] = (counts[token] || 0) + 1;
      total += 1;
    });
    if (total < 15) return warnings;
    let maxKey = "";
    let maxVal = 0;
    Object.keys(counts).forEach((k) => { if (counts[k] > maxVal) { maxVal = counts[k]; maxKey = k; } });
    if (maxVal / total >= 0.45) warnings.push({ code: "ANSWER_KEY_SKEW", message: "Warning: answer-key distribution is skewed toward option " + maxKey + " (" + maxVal + "/" + total + ")." });
    return warnings;
  }
  function detectLowFormatDiversity(questions) {
    const warnings = [];
    const uniq = new Set((questions || []).map((q) => q.format).filter(Boolean));
    if (uniq.size < 5) warnings.push({ code: "LOW_FORMAT_DIVERSITY", message: "Warning: low format diversity in available pool may reduce screening signal." });
    return warnings;
  }
  function sumNumericMap(m) {
    return Object.keys(m || {}).reduce((a, k) => a + Math.max(0, toInt(m[k], 0)), 0);
  }
  function buildDiagnostics(roleId, stacks) {
    const errors = NB.errors.slice();
    const warnings = NB.warnings.slice();
    const rows = [];
    const role = (C2.roles || {})[roleId];
    if (!role) errors.push({ code: "MISSING_REQUIRED_FIELD", message: "Cannot start: select a role." });
    if (STACK_REQUIRED && !stacks.length) errors.push({ code: "STACK_NOT_SELECTED", message: "Cannot start: choose at least one stack (UiPath, Automation Anywhere, Python, or Power Automate)." });
    if (!role || (STACK_REQUIRED && !stacks.length)) return { ok: false, roleId, roleLabel: role ? roleLabel(roleId) : "-", selectedStacks: stacks.slice(), quotaPlan: null, totalQuestions: BANK.length, countsByCategory: {}, countsByType: {}, countsByStack: {}, countsByDifficulty: {}, requirementRows: rows, errors: dedupeIssues(errors), warnings: dedupeIssues(warnings) };

    const quotaPlan = buildQuotaPlan(role, stacks);
    const qCount = quotaPlan.questionCount;
    const formatTargets = clone(role.format_targets || {});
    const difficultyTargets = clone(role.difficulty_targets || {});
    if (quotaPlan.generalMinimum + quotaPlan.stackMinimum + quotaPlan.seniorOnlyMinimum + quotaPlan.leadOnlyMinimum !== qCount) {
      errors.push({ code: "ROLE_BLUEPRINT_TOTAL_MISMATCH", message: "Role blueprint mismatch: general + stack + senior + lead minimums must equal question_count." });
    }
    if (sumNumericMap(formatTargets) !== qCount) errors.push({ code: "ROLE_BLUEPRINT_TOTAL_MISMATCH", message: "Role blueprint mismatch: format target totals must equal question_count." });
    if (sumNumericMap(difficultyTargets) !== qCount) errors.push({ code: "ROLE_BLUEPRINT_TOTAL_MISMATCH", message: "Role blueprint mismatch: difficulty target totals must equal question_count." });

    const eligible = BANK.filter((q) => allowedForRole(q, roleId, stacks) && isSelectableQuestion(q));
    const nonExclusive = eligible.filter((q) => !q.senior_only && !q.lead_only);
    const byCat = {}, byType = {}, byStack = {}, byDiff = {};
    eligible.forEach((q) => { addCount(byCat, q.category); addCount(byType, q.format); addCount(byStack, q.tech_stack); addCount(byDiff, String(q.difficulty)); });
    if (!eligible.some((q) => q.tech_stack !== "General")) {
      warnings.push({ code: "STACK_SELECTION_NO_EFFECT", message: "Warning: no stack-specific questions are available for this role; stack selection does not affect the generated paper." });
    }

    rows.push({ requirement: "Total eligible", required: qCount, available: eligible.length, status: eligible.length >= qCount ? "OK" : "SHORT" });
    if (eligible.length < qCount) errors.push({ code: "POOL_SHORTAGE_TOTAL", message: "Cannot start: only " + eligible.length + " eligible questions found; " + qCount + " required." });
    if (eligible.length === qCount) {
      warnings.push({ code: "LOW_VARIANCE_POOL", message: "Warning: eligible pool equals question_count; every attempt will use the same question IDs for this role." });
    }

    const generalAvail = nonExclusive.filter((q) => q.tech_stack === "General").length;
    rows.push({ requirement: "General minimum", required: quotaPlan.generalMinimum, available: generalAvail, status: generalAvail >= quotaPlan.generalMinimum ? "OK" : "SHORT" });
    if (generalAvail < quotaPlan.generalMinimum) errors.push({ code: "GENERAL_MINIMUM_SHORTAGE", message: "Cannot start: general pool needs at least " + quotaPlan.generalMinimum + " questions, but only " + generalAvail + " are available." });

    const stackAvailTotal = nonExclusive.filter((q) => q.tech_stack !== "General").length;
    rows.push({ requirement: "Stack minimum (all selected)", required: quotaPlan.stackMinimum, available: stackAvailTotal, status: stackAvailTotal >= quotaPlan.stackMinimum ? "OK" : "SHORT" });
    if (stackAvailTotal < quotaPlan.stackMinimum) errors.push({ code: "STACK_MINIMUM_SHORTAGE", message: "Cannot start: selected stacks need " + quotaPlan.stackMinimum + " stack questions, but only " + stackAvailTotal + " are available." });

    quotaPlan.selectedStacks.forEach((s) => {
      const req = Math.max(0, toInt(quotaPlan.stackQuotas[s], 0));
      const avail = nonExclusive.filter((q) => q.tech_stack === s).length;
      rows.push({ requirement: "Stack quota - " + stackLabel(s), required: req, available: avail, status: avail >= req ? "OK" : "SHORT" });
      if (avail < req) errors.push({ code: "STACK_QUOTA_SHORTAGE", message: "Cannot start: " + stackLabel(s) + " quota requires " + req + " questions, but only " + avail + " are available." });
    });

    const seniorAvail = eligible.filter((q) => q.senior_only && !q.lead_only).length;
    const leadAvail = eligible.filter((q) => q.lead_only).length;
    rows.push({ requirement: "Senior-only minimum", required: quotaPlan.seniorOnlyMinimum, available: seniorAvail, status: seniorAvail >= quotaPlan.seniorOnlyMinimum ? "OK" : "SHORT" });
    rows.push({ requirement: "Lead-only minimum", required: quotaPlan.leadOnlyMinimum, available: leadAvail, status: leadAvail >= quotaPlan.leadOnlyMinimum ? "OK" : "SHORT" });
    if (seniorAvail < quotaPlan.seniorOnlyMinimum) errors.push({ code: "SENIOR_ONLY_SHORTAGE", message: "Cannot start: senior-only minimum is " + quotaPlan.seniorOnlyMinimum + ", but only " + seniorAvail + " questions are available." });
    if (leadAvail < quotaPlan.leadOnlyMinimum) errors.push({ code: "LEAD_ONLY_SHORTAGE", message: "Cannot start: lead-only minimum is " + quotaPlan.leadOnlyMinimum + ", but only " + leadAvail + " questions are available." });

    const logReq = Math.max(0, toInt(role.log_analysis_minimum, 0));
    const logAvail = eligible.filter((q) => q.format === "log_analysis_single_choice").length;
    rows.push({ requirement: "Log-analysis minimum", required: logReq, available: logAvail, status: logAvail >= logReq ? "OK" : "SHORT" });
    if (logAvail < logReq) errors.push({ code: "LOG_MINIMUM_SHORTAGE", message: "Cannot start: log-analysis minimum is " + logReq + ", but only " + logAvail + " questions are available." });

    BANK.forEach((q) => {
      if (q.senior_only && roleIndex(q.role_level_min) < roleIndex("SeniorSE")) errors.push({ code: "EXCLUSIVE_ROLE_LEAK", message: "Question " + q.id + " is senior_only but role_level_min allows lower roles." });
      if (q.lead_only && roleIndex(q.role_level_min) < roleIndex("TechLead")) errors.push({ code: "EXCLUSIVE_ROLE_LEAK", message: "Question " + q.id + " is lead_only but role_level_min allows lower roles." });
    });

    detectNearDuplicates(eligible).forEach((w) => warnings.push(w));
    detectAnswerKeySkew(eligible).forEach((w) => warnings.push(w));
    detectLowFormatDiversity(eligible).forEach((w) => warnings.push(w));

    const hrSummary = [];
    if (errors.some((e) => e.code === "POOL_SHORTAGE_TOTAL")) hrSummary.push("Cannot start: only " + eligible.length + " eligible questions found; " + qCount + " required.");
    if (errors.some((e) => e.code === "STACK_MINIMUM_SHORTAGE" || e.code === "STACK_QUOTA_SHORTAGE")) hrSummary.push("Cannot start: selected stacks do not have enough questions for required stack coverage.");
    if (errors.some((e) => e.code === "LOG_MINIMUM_SHORTAGE")) hrSummary.push("Cannot start: not enough log-analysis questions for this role.");

    return {
      ok: dedupeIssues(errors).length === 0,
      roleId,
      roleLabel: roleLabel(roleId),
      selectedStacks: stacks.slice(),
      quotaPlan,
      totalQuestions: eligible.length,
      countsByCategory: byCat,
      countsByType: byType,
      countsByStack: byStack,
      countsByDifficulty: byDiff,
      requirementRows: rows,
      errors: dedupeIssues(errors),
      warnings: dedupeIssues(warnings),
      hrSummary
    };
  }

  function formatDeficitForQuestion(q, formatTarget, currentFormat) {
    if (!q || !formatTarget) return 0;
    const f = String(q.format || "");
    if (f === "single_choice" || f === "best_next_step") {
      const req = Math.max(0, toInt(formatTarget.single_or_best_next_step, 0));
      const cur = Math.max(0, toInt(currentFormat.single_choice, 0)) + Math.max(0, toInt(currentFormat.best_next_step, 0));
      return Math.max(0, req - cur);
    }
    return Math.max(0, toInt(formatTarget[f], 0) - toInt(currentFormat[f], 0));
  }
  function difficultyDeficitForQuestion(q, difficultyTarget, currentDifficulty) {
    return Math.max(0, toInt((difficultyTarget || {})[String((q || {}).difficulty)], 0) - toInt((currentDifficulty || {})[String((q || {}).difficulty)], 0));
  }
  function rankCandidate(q, ctx) {
    let score = 0;
    if (ctx.needLog) score += q.format === "log_analysis_single_choice" ? 120 : -20;
    score += formatDeficitForQuestion(q, ctx.formatTarget, ctx.currentFormat) * 14;
    score += difficultyDeficitForQuestion(q, ctx.difficultyTarget, ctx.currentDifficulty) * 10;
    if (ctx.requiredStack) score += q.tech_stack === ctx.requiredStack ? 60 : -60;
    if (ctx.preferGeneral) score += q.tech_stack === "General" ? 18 : -12;
    if (q.tech_stack !== "General") score += Math.max(0, toInt((ctx.stackTarget || {})[q.tech_stack], 0) - toInt((ctx.currentStack || {})[q.tech_stack], 0)) * 6;
    return score;
  }
  function pickBest(candidates, rankCtx, tieRank) {
    let best = null;
    let bestScore = -Infinity;
    let bestTie = Infinity;
    candidates.forEach((q) => {
      const s = rankCandidate(q, rankCtx);
      const t = toInt(tieRank.get(q.id), 999999);
      if (s > bestScore || (s === bestScore && t < bestTie) || (s === bestScore && t === bestTie && q.id < (best ? best.id : "~"))) {
        best = q;
        bestScore = s;
        bestTie = t;
      }
    });
    return best;
  }
  function buildSelection(roleId, stacks, seed, quotaPlan) {
    const role = (C2.roles || {})[roleId];
    if (!role) throw new Error("Role not found.");

    const plan = quotaPlan || buildQuotaPlan(role, stacks);
    const qCount = Math.max(0, toInt(role.question_count, 0));
    const logReq = Math.max(0, toInt(role.log_analysis_minimum, 0));
    const formatTarget = clone(role.format_targets || {});
    const difficultyTarget = {};
    Object.keys(role.difficulty_targets || {}).forEach((k) => { difficultyTarget[String(k)] = toInt(role.difficulty_targets[k], 0); });
    const stackTarget = clone(plan.stackQuotas || {});

    const seedKey = [roleId, STACKS.filter((s) => stacks.includes(s)).join("+"), C2.questionBankVersion || "v2", seed].join("|");
    const eff = hashSeed(seedKey);
    const r = rng(eff);

    const pool = BANK.filter((q) => allowedForRole(q, roleId, stacks) && isSelectableQuestion(q)).sort((a, b) => a.id.localeCompare(b.id));
    if (pool.length < qCount) throw new Error("Cannot start: only " + pool.length + " eligible questions found; " + qCount + " required.");

    const tieIds = pool.map((q) => q.id);
    shuffle(tieIds, r);
    const tieRank = new Map(tieIds.map((x, i) => [x, i]));

    const used = new Set();
    const picks = [];
    const substitutions = [];
    const warnings = [];
    const curFormat = {};
    const curDifficulty = {};
    const curStack = {};
    let curLog = 0;
    let curGeneralNonExclusive = 0;
    let curSeniorOnly = 0;
    let curLeadOnly = 0;

    function updateCounts(q) {
      addCount(curFormat, q.format);
      addCount(curDifficulty, String(q.difficulty));
      if (q.tech_stack !== "General") addCount(curStack, q.tech_stack);
      if (q.format === "log_analysis_single_choice") curLog += 1;
      if (q.senior_only && !q.lead_only) curSeniorOnly += 1;
      if (q.lead_only) curLeadOnly += 1;
      if (!q.senior_only && !q.lead_only && q.tech_stack === "General") curGeneralNonExclusive += 1;
    }
    function pickOne(stage, filterFn, requiredStack, preferGeneral) {
      const candidates = pool.filter((q) => !used.has(q.id) && filterFn(q));
      if (!candidates.length) throw new Error("Selection failed: insufficient questions for stage '" + stage + "'.");
      const chosen = pickBest(candidates, {
        needLog: curLog < logReq,
        formatTarget,
        difficultyTarget,
        stackTarget,
        currentFormat: curFormat,
        currentDifficulty: curDifficulty,
        currentStack: curStack,
        requiredStack: requiredStack || null,
        preferGeneral: !!preferGeneral
      }, tieRank);
      if (!chosen) throw new Error("Selection failed: unable to choose question at stage '" + stage + "'.");
      used.add(chosen.id);
      picks.push(chosen);
      updateCounts(chosen);
      substitutions.push({ stage, id: chosen.id, stack: chosen.tech_stack, format: chosen.format, difficulty: chosen.difficulty });
    }
    function hasCandidate(filterFn) {
      for (let i = 0; i < pool.length; i += 1) {
        const q = pool[i];
        if (!used.has(q.id) && filterFn(q)) return true;
      }
      return false;
    }
    function pickOneWithFallback(stage, filters, requiredStack, preferGeneral) {
      for (let i = 0; i < filters.length; i += 1) {
        const filterFn = filters[i];
        if (!hasCandidate(filterFn)) continue;
        pickOne(i === 0 ? stage : (stage + "_fallback_" + i), filterFn, requiredStack, preferGeneral && i === 0);
        return;
      }
      throw new Error("Selection failed: insufficient questions for stage '" + stage + "'.");
    }

    for (let i = 0; i < plan.leadOnlyMinimum; i += 1) pickOne("lead_only_minimum", (q) => q.lead_only, null, false);
    for (let i = 0; i < plan.seniorOnlyMinimum; i += 1) pickOne("senior_only_minimum", (q) => q.senior_only && !q.lead_only, null, false);

    plan.selectedStacks.forEach((s) => {
      const req = Math.max(0, toInt(plan.stackQuotas[s], 0));
      for (let i = 0; i < req; i += 1) pickOne("stack_quota_" + s, (q) => !q.senior_only && !q.lead_only && q.tech_stack === s, s, false);
    });

    while (curLog < logReq) {
      const needGeneral = curGeneralNonExclusive < plan.generalMinimum;
      if (needGeneral) {
        pickOneWithFallback(
          "log_minimum",
          [
            (q) => !q.senior_only && !q.lead_only && q.tech_stack === "General" && q.format === "log_analysis_single_choice",
            (q) => !q.senior_only && !q.lead_only && q.format === "log_analysis_single_choice"
          ],
          null,
          true
        );
      } else {
        pickOne("log_minimum", (q) => !q.senior_only && !q.lead_only && q.format === "log_analysis_single_choice", null, false);
      }
    }
    while (picks.length < qCount) {
      const needGeneral = curGeneralNonExclusive < plan.generalMinimum;
      if (needGeneral) {
        pickOne("general_fill", (q) => !q.senior_only && !q.lead_only && q.tech_stack === "General", null, true);
      } else {
        pickOneWithFallback(
          "nonexclusive_fill",
          [
            (q) => !q.senior_only && !q.lead_only && q.tech_stack === "General",
            (q) => !q.senior_only && !q.lead_only
          ],
          null,
          false
        );
      }
    }

    if (curGeneralNonExclusive < plan.generalMinimum) throw new Error("Generated paper violates general minimum.");
    if (curSeniorOnly < plan.seniorOnlyMinimum) throw new Error("Generated paper violates senior-only minimum.");
    if (curLeadOnly < plan.leadOnlyMinimum) throw new Error("Generated paper violates lead-only minimum.");
    if (curLog < logReq) throw new Error("Generated paper violates log-analysis minimum.");
    plan.selectedStacks.forEach((s) => {
      if (toInt(curStack[s], 0) < toInt(plan.stackQuotas[s], 0)) throw new Error("Generated paper violates stack quota for " + s + ".");
    });

    const final = picks.slice();
    shuffle(final, r);
    return { selected: final, seed, seedKey, effectiveSeed: eff, substitutions, warnings };
  }
  function buildAttempt(practice, overrideUsed) {
    const role = (C2.roles || {})[S.selectedRole];
    if (!role) throw new Error("Select a role before starting.");
    if (STACK_REQUIRED && !S.selectedStacks.length) throw new Error("Select at least one stack.");
    if (!S.diag || !S.diag.quotaPlan) throw new Error("Diagnostics not ready.");

    const seed = seedFromUrl() !== null ? seedFromUrl() : makeSeed();
    const selection = buildSelection(S.selectedRole, S.selectedStacks.slice(), seed, S.diag.quotaPlan);
    if (!selection || !Array.isArray(selection.selected) || !selection.selected.length) {
      throw new Error("No questions could be generated. Refresh and run Diagnostics.");
    }
    const r = rng(selection.effectiveSeed ^ 0xa5a5a5a5);
    const selectedQuestions = [];
    const answers = {};

    selection.selected.forEach((q) => {
      const m = { id: q.id };
      if (Array.isArray(q.options) && q.options.length) m.optionOrderMap = shuffle(seq(q.options.length), r);
      if (q.format === "fill_in_blank_constrained" && Array.isArray(q.choices) && q.choices.length) m.choiceOrderMap = shuffle(seq(q.choices.length), r);
      if (q.format === "ordering" && Array.isArray(q.items)) { m.orderingInitialOrder = shuffle(seq(q.items.length), r); answers[q.id] = m.orderingInitialOrder.slice(); }
      if ((q.format === "match_pairs" || (q.format === "case_triage" && q.case_triage_variant === "match_pairs")) && Array.isArray(q.right_items) && q.right_items.length) m.pairRightOrder = shuffle(seq(q.right_items.length), r);
      selectedQuestions.push(m);
    });

    return {
      status: "in_progress",
      mode: practice ? "practice" : "assessment",
      roleId: S.selectedRole,
      roleSnapshot: clone(role),
      selectedStacks: S.selectedStacks.slice(),
      seed: seed >>> 0,
      seedKey: selection.seedKey,
      effectiveSeed: selection.effectiveSeed,
      startedAt: new Date().toISOString(),
      endedAt: null,
      remainingSeconds: practice ? null : toInt(role.time_limit_minutes, 0) * 60,
      currentIndex: 0,
      selectedQuestions,
      answers,
      checkedQuestions: {},
      attention: { tabHiddenCount: 0, tabHiddenSeconds: 0, copyEventCount: 0, pasteEventCount: 0 },
      questionBankVersion: C2.questionBankVersion || "2.0.0",
      blueprintSnapshot: clone(role),
      quotaPlan: clone(S.diag.quotaPlan),
      diagnosticsSnapshot: {
        blockingCount: S.diag.errors.length,
        warningCount: S.diag.warnings.length + selection.warnings.length,
        blockingCodes: S.diag.errors.map((x) => x.code),
        warningCodes: S.diag.warnings.map((x) => x.code).concat(selection.warnings.map((x) => x.code)),
        selectionWarnings: clone(selection.warnings),
        substitutions: clone(selection.substitutions)
      },
      overrideUsed: !!overrideUsed,
      lastUpdatedAt: Date.now()
    };
  }

  function currentCtx() {
    if (!S.attempt || S.attempt.status !== "in_progress") return null;
    const i = clamp(toInt(S.attempt.currentIndex, 0), 0, Math.max(0, S.attempt.selectedQuestions.length - 1));
    const m = S.attempt.selectedQuestions[i];
    const q = m ? QMAP.get(m.id) : null;
    if (!m || !q) return null;
    return { i, m, q };
  }
  function presentedOptions(q, m) { const ord = Array.isArray(m.optionOrderMap) ? m.optionOrderMap.slice() : seq((q.options || []).length); return ord.map((orig, pos) => ({ orig, pos, text: q.options[orig] })); }
  function presentedChoices(q, m) { const ord = Array.isArray(m.choiceOrderMap) ? m.choiceOrderMap.slice() : seq((q.choices || []).length); return ord.map((orig, pos) => ({ orig, pos, text: q.choices[orig] })); }
  function presentedPairRights(q, m) { const ord = Array.isArray(m.pairRightOrder) ? m.pairRightOrder.slice() : seq((q.right_items || []).length); return ord.map((orig, pos) => ({ orig, pos, text: q.right_items[orig] })); }

  function tokenToIndex(token, options) {
    if (Number.isInteger(token)) return token;
    const t = String(token == null ? "" : token).trim();
    if (/^\d+$/.test(t)) return toInt(t, -1);
    if (/^[A-Za-z]$/.test(t)) return t.toUpperCase().charCodeAt(0) - 65;
    return options.findIndex((x) => String(x) === t);
  }
  function uniqInts(arr) {
    if (!Array.isArray(arr)) return [];
    const out = []; const seen = new Set();
    arr.forEach((x) => { const n = toInt(x, NaN); if (Number.isInteger(n) && !seen.has(n)) { seen.add(n); out.push(n); } });
    out.sort((a, b) => a - b);
    return out;
  }

  function isAnswered(q, a) {
    if (!q) return false;
    const choiceLike = ["single_choice", "best_next_step", "log_analysis_single_choice", "trace_execution"].includes(q.format) || (q.format === "case_triage" && q.case_triage_variant !== "match_pairs");
    if (choiceLike) return Number.isInteger(a);
    if (q.format === "multi_select") return Array.isArray(a) && a.length > 0;
    if (q.format === "ordering") return Array.isArray(a) && a.length === (q.items || []).length;
    if (q.format === "fill_in_blank_constrained") return Array.isArray(a) ? a.length > 0 : (typeof a === "string" && a.length > 0);
    if (q.format === "match_pairs" || (q.format === "case_triage" && q.case_triage_variant === "match_pairs")) return !!a && typeof a === "object" && (q.left_items || []).every((k) => typeof a[k] === "string" && a[k].length > 0);
    return false;
  }
  function answeredCount() { if (!S.attempt) return 0; let n = 0; S.attempt.selectedQuestions.forEach((m) => { const q = QMAP.get(m.id); if (isAnswered(q, S.attempt.answers[m.id])) n += 1; }); return n; }
  function unansweredCount() { if (!S.attempt) return 0; let n = 0; S.attempt.selectedQuestions.forEach((m) => { const q = QMAP.get(m.id); if (!isAnswered(q, S.attempt.answers[m.id])) n += 1; }); return n; }

  function scoreQuestion(q, answer) {
    const points = Math.max(0, toNum(q.points, 1));
    const method = q.scoring_method || defaultScoring(q.format, q);
    let norm = 0;
    const choiceLike = ["single_choice", "best_next_step", "log_analysis_single_choice", "trace_execution"].includes(q.format) || (q.format === "case_triage" && q.case_triage_variant !== "match_pairs");
    if (choiceLike) {
      const exp = (q.correct_answer || []).map((t) => tokenToIndex(t, q.options || [])).filter((x) => x >= 0);
      norm = exp.includes(toInt(answer, -999)) ? 1 : 0;
    } else if (q.format === "multi_select") {
      const exp = new Set((q.correct_answer || []).map((t) => tokenToIndex(t, q.options || [])).filter((x) => x >= 0));
      const sel = uniqInts(answer);
      const selSet = new Set(sel);
      if (method === "all_or_nothing") norm = exp.size === selSet.size && Array.from(exp).every((x) => selSet.has(x)) ? 1 : 0;
      else {
        let c = 0, w = 0;
        sel.forEach((x) => { if (exp.has(x)) c += 1; else w += 1; });
        norm = exp.size ? (Math.max(0, c - w) / exp.size) : 0;
      }
    } else if (q.format === "ordering") {
      const exp = Array.isArray(q.correct_order) ? q.correct_order : [];
      const act = Array.isArray(answer) ? answer : [];
      if (method === "all_or_nothing") norm = exp.length === act.length && exp.every((v, i) => toInt(act[i], -1) === toInt(v, -2)) ? 1 : 0;
      else if (exp.length && act.length === exp.length) {
        let ok = 0;
        for (let i = 0; i < exp.length; i += 1) if (toInt(act[i], -1) === toInt(exp[i], -2)) ok += 1;
        norm = ok / exp.length;
      }
    } else if (q.format === "match_pairs" || (q.format === "case_triage" && q.case_triage_variant === "match_pairs")) {
      const corr = q.correct_pairs || {};
      const keys = Object.keys(corr);
      const ans = answer && typeof answer === "object" ? answer : {};
      if (method === "all_or_nothing") norm = keys.length && keys.every((k) => String(ans[k] || "") === String(corr[k])) ? 1 : 0;
      else {
        let c = 0, w = 0;
        keys.forEach((k) => { const g = String(ans[k] || ""); if (!g) return; if (g === String(corr[k])) c += 1; else w += 1; });
        norm = keys.length ? (Math.max(0, c - w) / keys.length) : 0;
      }
    } else if (q.format === "fill_in_blank_constrained") {
      const accepted = (q.accepted_answers || []).map((x) => String(x).trim());
      const a = Array.isArray(answer) ? String(answer[0] || "").trim() : String(answer || "").trim();
      norm = accepted.includes(a) ? 1 : 0;
    }
    norm = clamp(norm, 0, 1);
    return { normalized: norm, isCorrect: norm >= 0.999, pointsPossible: points, pointsEarned: Math.round(norm * points * 100) / 100 };
  }

  function presentAnswers(q, m, answer) {
    const choiceLike = ["single_choice", "best_next_step", "log_analysis_single_choice", "trace_execution"].includes(q.format) || (q.format === "case_triage" && q.case_triage_variant !== "match_pairs");
    if (choiceLike) {
      const expIdx = (q.correct_answer || []).map((t) => tokenToIndex(t, q.options || [])).filter((x) => x >= 0);
      return {
        optionsPresented: presentedOptions(q, m).map((x) => x.text),
        correctAnswer: expIdx.map((i) => q.options[i]),
        userAnswer: Number.isInteger(answer) ? [q.options[answer]] : []
      };
    }
    if (q.format === "multi_select") {
      const expIdx = (q.correct_answer || []).map((t) => tokenToIndex(t, q.options || [])).filter((x) => x >= 0);
      const sel = uniqInts(answer);
      return {
        optionsPresented: presentedOptions(q, m).map((x) => x.text),
        correctAnswer: expIdx.map((i) => q.options[i]),
        userAnswer: sel.map((i) => q.options[i])
      };
    }
    if (q.format === "ordering") {
      return {
        optionsPresented: (m.orderingInitialOrder || seq((q.items || []).length)).map((i) => q.items[i]),
        correctAnswer: (q.correct_order || []).map((i) => q.items[i]),
        userAnswer: Array.isArray(answer) ? answer.map((i) => q.items[i]) : []
      };
    }
    if (q.format === "fill_in_blank_constrained") {
      return {
        optionsPresented: presentedChoices(q, m).map((x) => x.text),
        correctAnswer: (q.accepted_answers || []).slice(),
        userAnswer: Array.isArray(answer) ? answer.slice() : [answer].filter(Boolean)
      };
    }
    if (q.format === "match_pairs" || (q.format === "case_triage" && q.case_triage_variant === "match_pairs")) {
      const ans = answer && typeof answer === "object" ? answer : {};
      const corr = q.correct_pairs || {};
      const left = q.left_items || [];
      return {
        optionsPresented: presentedPairRights(q, m).map((x) => x.text),
        correctAnswer: left.map((k) => k + " -> " + (corr[k] || "(none)")),
        userAnswer: left.map((k) => k + " -> " + (ans[k] || "(none)"))
      };
    }
    return { optionsPresented: [], correctAnswer: [], userAnswer: [] };
  }
  function fmtAnswer(v) {
    if (v == null) return "No answer";
    if (Array.isArray(v)) return v.length ? v.join(" | ") : "No answer";
    if (typeof v === "object") { const keys = Object.keys(v); return keys.length ? keys.map((k) => k + " -> " + v[k]).join(" | ") : "No answer"; }
    return String(v);
  }

  function flushHiddenTime() {
    if (!S.attempt || !S.hiddenAt || document.visibilityState !== "visible") return;
    S.attempt.attention.tabHiddenSeconds += Math.max(0, Math.floor((Date.now() - S.hiddenAt) / 1000));
    S.hiddenAt = null;
  }

  function buildResult() {
    const a = S.attempt;
    const role = (C2.roles || {})[a.roleId] || a.roleSnapshot || {};
    flushHiddenTime();
    const end = a.endedAt || new Date().toISOString();

    let earned = 0, possible = 0;
    const per = [];
    const byCat = {};

    a.selectedQuestions.forEach((m) => {
      const q = QMAP.get(m.id);
      if (!q) return;
      const ans = a.answers[q.id];
      const score = scoreQuestion(q, ans);
      const pres = presentAnswers(q, m, ans);
      earned += score.pointsEarned;
      possible += score.pointsPossible;
      if (!byCat[q.category]) byCat[q.category] = { correctCount: 0, totalCount: 0 };
      byCat[q.category].totalCount += 1;
      if (score.isCorrect) byCat[q.category].correctCount += 1;
      per.push({
        id: q.id,
        tech_stack: q.tech_stack,
        category: q.category,
        difficulty: q.difficulty,
        format: q.format,
        question_text: q.question_text,
        log_snippet: q.log_snippet || null,
        optionsPresented: pres.optionsPresented,
        correctAnswer: pres.correctAnswer,
        userAnswer: pres.userAnswer,
        normalizedScore: score.normalized,
        isCorrect: score.isCorrect,
        pointsEarned: score.pointsEarned,
        pointsPossible: score.pointsPossible,
        explanation: q.explanation
      });
    });

    const percent = possible ? Math.round((earned / possible) * 1000) / 10 : 0;
    const passPercent = toInt(a.roleSnapshot.pass_percentage, toInt(role.pass_percentage, 0));
    const pass = percent >= passPercent;
    const reviewBandPercent = Math.max(0, toInt(C2.borderlineReviewBandPercent, 0));
    const borderlineReview = !pass && percent >= Math.max(0, passPercent - reviewBandPercent);

    const breakdown = {};
    Object.keys(byCat).forEach((k) => {
      const r = byCat[k];
      breakdown[k] = { correctCount: r.correctCount, totalCount: r.totalCount, percent: r.totalCount ? Math.round((r.correctCount / r.totalCount) * 1000) / 10 : 0 };
    });

    let usedSeconds = 0;
    if (a.mode === "assessment") {
      const lim = toInt(a.roleSnapshot.time_limit_minutes, toInt(role.time_limit_minutes, 0)) * 60;
      usedSeconds = clamp(lim - Math.max(0, toInt(a.remainingSeconds, 0)), 0, lim);
    } else {
      const st = Date.parse(a.startedAt), ed = Date.parse(end);
      if (!Number.isNaN(st) && !Number.isNaN(ed)) usedSeconds = Math.max(0, Math.floor((ed - st) / 1000));
    }

    return {
      schemaVersion: C2.schemaVersion || "2.0.0",
      questionBankVersion: a.questionBankVersion || C2.questionBankVersion || "2.0.0",
      roleId: a.roleId,
      roleLabel: roleLabel(a.roleId),
      selectedStacks: a.selectedStacks.slice(),
      passPercent,
      reviewBandPercent,
      borderlineReview,
      practiceMode: a.mode === "practice",
      seed: a.seed,
      seedKey: a.seedKey,
      effectiveSeed: a.effectiveSeed,
      timestampStart: a.startedAt,
      timestampEnd: end,
      timeLimitSeconds: a.mode === "assessment" ? toInt(a.roleSnapshot.time_limit_minutes, toInt(role.time_limit_minutes, 0)) * 60 : null,
      timeUsedSeconds: usedSeconds,
      selectedQuestionIds: a.selectedQuestions.map((x) => x.id),
      blueprintSnapshot: clone(a.blueprintSnapshot || a.roleSnapshot || role),
      quotaPlan: clone(a.quotaPlan || {}),
      diagnosticsSnapshot: clone(a.diagnosticsSnapshot || {}),
      overrideUsed: !!a.overrideUsed,
      perQuestion: per,
      totals: { pointsEarned: Math.round(earned * 100) / 100, pointsPossible: Math.round(possible * 100) / 100, percent, pass, borderlineReview },
      breakdownByCategory: breakdown,
      attentionEvents: {
        tabHiddenCount: toInt(a.attention.tabHiddenCount, 0),
        tabHiddenSeconds: toInt(a.attention.tabHiddenSeconds, 0),
        copyEventCount: toInt(a.attention.copyEventCount, 0),
        pasteEventCount: toInt(a.attention.pasteEventCount, 0)
      }
    };
  }

  function renderRoleSelector() {
    E.roleSelect.innerHTML = ROLE_IDS.map((r) => '<option value="' + esc(r) + '">' + esc(roleLabel(r)) + "</option>").join("");
    E.roleSelect.value = S.selectedRole || DEFAULT_ROLE || "";
    E.roleSelect.disabled = !!(S.attempt && S.attempt.status === "in_progress");
  }
  function renderStackSelector() {
    if (E.stackLabel) {
      E.stackLabel.textContent = STACK_REQUIRED ? "Tech Stack (select at least one)" : "Tech Stack (optional)";
    }
    if (E.stackPicker) {
      E.stackPicker.classList.toggle("hidden", !STACK_REQUIRED && !HAS_STACK_SPECIFIC_QUESTIONS);
    }
    if (!HAS_STACK_SPECIFIC_QUESTIONS) {
      S.selectedStacks = [];
      E.stackOptions.innerHTML = "";
      return;
    }
    E.stackOptions.innerHTML = STACKS.map((s) => {
      const checked = S.selectedStacks.includes(s) ? "checked" : "";
      const disabled = (S.attempt && S.attempt.status === "in_progress") ? "disabled" : "";
      const sid = "stack_" + s.toLowerCase();
      return '<label class="stack-chip" for="' + esc(sid) + '"><input id="' + esc(sid) + '" type="checkbox" data-stack="' + esc(s) + '" ' + checked + " " + disabled + ' /><span>' + esc(stackLabel(s)) + "</span></label>";
    }).join("");
  }
  function renderRoleSummary() {
    const role = (C2.roles || {})[S.selectedRole];
    if (!role) { E.roleSummary.classList.add("hidden"); E.roleSummary.innerHTML = ""; return; }
    E.roleSummary.innerHTML =
      "<p><strong>Questions:</strong> " + toInt(role.question_count, 0) +
      " | <strong>Time:</strong> " + toInt(role.time_limit_minutes, 0) + " mins" +
      " | <strong>Pass:</strong> " + toInt(role.pass_percentage, 0) + "%</p>" +
      "<p><strong>General minimum:</strong> " + toInt(role.general_minimum, 0) +
      " | <strong>Stack minimum:</strong> " + toInt(role.stack_minimum, 0) +
      " | <strong>Senior-only minimum:</strong> " + toInt(role.senior_only_minimum, 0) +
      " | <strong>Lead-only minimum:</strong> " + toInt(role.lead_only_minimum, 0) +
      " | <strong>Log-analysis minimum:</strong> " + toInt(role.log_analysis_minimum, 0) + "</p>";
    E.roleSummary.classList.remove("hidden");
  }
  function renderLandingRules() {
    const role = (C2.roles || {})[S.selectedRole];
    if (!role) {
      E.landingTitle.textContent = "RPA Technical Screener";
      E.landingRules.innerHTML = STACK_REQUIRED ? "<li>Select role and stack(s) before starting.</li>" : "<li>Select a role before starting.</li>";
      return;
    }
    E.landingTitle.textContent = roleLabel(S.selectedRole) + " Screener (" + toInt(role.time_limit_minutes, 0) + " Minutes)";
    const rules = [
      toInt(role.question_count, 0) + " questions",
      toInt(role.time_limit_minutes, 0) + " minutes",
      "Pass mark " + toInt(role.pass_percentage, 0) + "%",
      "Auto-submit at timer end in Assessment mode"
    ];
    E.landingRules.innerHTML = rules.map((x) => "<li>" + esc(x) + "</li>").join("");
  }

  function renderStackSummary() {
    const role = (C2.roles || {})[S.selectedRole];
    if (!role) { E.stackSummary.textContent = "Select a role to preview stack coverage."; return; }
    if (!HAS_STACK_SPECIFIC_QUESTIONS) {
      E.stackSummary.textContent = "Current question bank has no stack-specific questions; this assessment uses General questions only.";
      return;
    }
    if (!S.selectedStacks.length) {
      E.stackSummary.textContent = STACK_REQUIRED ? "No stack selected. Choose at least one stack." : "No stack selected (optional). General questions only.";
      return;
    }
    const warns = [];
    const q = buildQuotas(role, S.selectedStacks, warns);
    const text = q.selectedStacks.map((s) => stackLabel(s) + ":" + q.stackQuotas[s]).join(" | ");
    E.stackSummary.textContent = "Stack quota plan -> total stack minimum: " + q.stackMinimum + ", general minimum: " + q.generalMinimum + ", quotas: " + text + ".";
  }
  function renderDiagnostics() {
    const d = S.diag || { roleLabel: "-", selectedStacks: [], totalQuestions: 0, countsByCategory: {}, countsByType: {}, countsByStack: {}, countsByDifficulty: {}, requirementRows: [], errors: [], warnings: [] };
    E.diagRoleMeta.textContent = "Role: " + d.roleLabel + " | Stacks: " + (d.selectedStacks.length ? d.selectedStacks.map(stackLabel).join(", ") : "-");
    E.diagTotalQuestions.textContent = String(d.totalQuestions || 0);
    E.diagCategoryBody.innerHTML = Object.keys(d.countsByCategory).sort().map((k) => "<tr><td>" + esc(k) + "</td><td>" + toInt(d.countsByCategory[k], 0) + "</td></tr>").join("");
    E.diagTypeBody.innerHTML = Object.keys(d.countsByType).sort().map((k) => "<tr><td>" + esc(formatLabel(k)) + "</td><td>" + toInt(d.countsByType[k], 0) + "</td></tr>").join("");
    E.diagStackBody.innerHTML = Object.keys(d.countsByStack).sort().map((k) => "<tr><td>" + esc(stackLabel(k)) + "</td><td>" + toInt(d.countsByStack[k], 0) + "</td></tr>").join("");
    E.diagDifficultyBody.innerHTML = Object.keys(d.countsByDifficulty).sort((a, b) => toInt(a, 0) - toInt(b, 0)).map((k) => "<tr><td>" + esc(k) + "</td><td>" + toInt(d.countsByDifficulty[k], 0) + "</td></tr>").join("");
    E.diagRequirementBody.innerHTML = d.requirementRows.map((r) => "<tr><td>" + esc(r.requirement) + "</td><td>" + toInt(r.required, 0) + "</td><td>" + toInt(r.available, 0) + "</td><td>" + esc(r.status) + "</td></tr>").join("");
    E.diagErrors.innerHTML = d.errors.length ? d.errors.map((x) => '<li class="bad">[' + esc(x.code) + "] " + esc(x.message) + "</li>").join("") : '<li class="ok">No blocking issues detected.</li>';
    const hr = Array.isArray(d.hrSummary) ? d.hrSummary : [];
    E.diagWarnings.innerHTML = (d.warnings.length || hr.length)
      ? hr.map((x) => "<li><strong>HR:</strong> " + esc(x) + "</li>").concat(d.warnings.map((x) => "<li>[" + esc(x.code) + "] " + esc(x.message) + "</li>")).join("")
      : '<li class="ok">No warnings detected.</li>';
  }

  function refreshLanding() {
    S.diag = buildDiagnostics(S.selectedRole, S.selectedStacks.slice());
    renderDiagnostics();
    renderStackSummary();

    const allowOverride = !!C2.allowAdminOverride;
    if (allowOverride) E.adminOverrideWrap.classList.remove("hidden");
    else { E.adminOverrideWrap.classList.add("hidden"); if (E.adminOverrideToggle) E.adminOverrideToggle.checked = false; }
    const override = allowOverride && E.adminOverrideToggle && E.adminOverrideToggle.checked;

    let blocked = false;
    let status = "Diagnostics: ready.";
    let cls = "ok";

    if (!(C2.roles || {})[S.selectedRole]) { blocked = true; status = "Select a role."; cls = "bad"; }
    else if (STACK_REQUIRED && !S.selectedStacks.length) { blocked = true; status = "Select at least one stack."; cls = "bad"; }
    else if (!S.diag.ok && !override) { blocked = true; status = "Diagnostics: blocking issues found."; cls = "bad"; }
    else if (!S.diag.ok && override) { status = "Diagnostics: override enabled. Start allowed with warnings."; cls = "ok"; }
    else if (S.diag.ok && S.diag.warnings.length) { status = "Diagnostics: ready with warnings."; cls = "ok"; }

    E.diagnosticsStatus.textContent = status;
    E.diagnosticsStatus.classList.remove("hidden", "ok", "bad");
    E.diagnosticsStatus.classList.add(cls);

    E.startBtn.disabled = blocked || !!(S.attempt && S.attempt.status === "in_progress");
    E.openDiagnosticsBtn.disabled = !(C2.roles || {})[S.selectedRole];

    if (blocked && S.diag.errors.length) { E.landingError.textContent = S.diag.errors[0].message; E.landingError.classList.remove("hidden"); }
    else { E.landingError.classList.add("hidden"); E.landingError.textContent = ""; }
  }

  function renderLanding() {
    if (S.attempt && S.attempt.status === "in_progress") {
      if (ROLE_IDS.includes(S.attempt.roleId)) S.selectedRole = S.attempt.roleId;
      if (Array.isArray(S.attempt.selectedStacks) && S.attempt.selectedStacks.length) S.selectedStacks = S.attempt.selectedStacks.filter((s) => STACKS.includes(s));
    }

    renderRoleSelector();
    renderStackSelector();
    renderLandingRules();
    renderRoleSummary();

    if (!C2.practiceModeEnabled) { E.practiceToggle.checked = false; E.practiceToggle.disabled = true; }

    if (S.attempt && S.attempt.status === "in_progress") {
      E.resumeBtn.classList.remove("hidden");
      E.resumeCard.classList.remove("hidden");
      E.resumeSummary.textContent = S.attempt.mode === "assessment"
        ? "In-progress " + roleLabel(S.attempt.roleId) + " assessment found. Remaining time: " + fmtClock(toInt(S.attempt.remainingSeconds, 0)) + "."
        : "In-progress " + roleLabel(S.attempt.roleId) + " practice attempt found.";
    } else {
      E.resumeBtn.classList.add("hidden");
      E.resumeCard.classList.add("hidden");
      E.resumeSummary.textContent = "";
    }

    refreshLanding();
  }

  function renderNavigator() {
    if (!S.attempt || S.attempt.status !== "in_progress") { E.questionGrid.innerHTML = ""; return; }
    E.questionGrid.innerHTML = S.attempt.selectedQuestions.map((m, i) => {
      const q = QMAP.get(m.id);
      const classes = ["q-btn"];
      if (i === S.attempt.currentIndex) classes.push("current");
      classes.push(isAnswered(q, S.attempt.answers[m.id]) ? "answered" : "unanswered");
      return '<button type="button" class="' + esc(classes.join(" ")) + '" data-nav-index="' + i + '">' + (i + 1) + "</button>";
    }).join("");
  }

  function renderQuestion() {
    const c = currentCtx();
    if (!c) return;

    E.questionTitle.textContent = "Question " + (c.i + 1);
    E.questionMeta.textContent = roleLabel(S.attempt.roleId) + " | " + stackLabel(c.q.tech_stack) + " | " + c.q.category + " | " + formatLabel(c.q.format) + " | D" + c.q.difficulty;
    E.questionPrompt.innerHTML = promptHtml(c.q.question_text, c.q);

    if (c.q.log_snippet) { E.questionLog.classList.remove("hidden"); E.questionLogCode.textContent = c.q.log_snippet; }
    else { E.questionLog.classList.add("hidden"); E.questionLogCode.textContent = ""; }

    const a = S.attempt.answers[c.q.id];
    const choiceLike = ["single_choice", "best_next_step", "log_analysis_single_choice", "trace_execution"].includes(c.q.format) || (c.q.format === "case_triage" && c.q.case_triage_variant !== "match_pairs");

    if (choiceLike) {
      const name = "ans_" + c.q.id;
      E.answerContainer.innerHTML = '<div class="option-list">' + presentedOptions(c.q, c.m).map((o) => {
        const checked = Number.isInteger(a) && a === o.orig ? "checked" : "";
        const rid = name + "_" + o.pos;
        return '<label class="option-row" for="' + esc(rid) + '"><input id="' + esc(rid) + '" data-answer-type="single" type="radio" name="' + esc(name) + '" value="' + o.orig + '" ' + checked + ' /><span>' + esc(o.text) + "</span></label>";
      }).join("") + "</div>";
    } else if (c.q.format === "multi_select") {
      const set = new Set(Array.isArray(a) ? a : []);
      const name = "ans_" + c.q.id;
      E.answerContainer.innerHTML = '<div class="option-list">' + presentedOptions(c.q, c.m).map((o) => {
        const checked = set.has(o.orig) ? "checked" : "";
        const rid = name + "_" + o.pos;
        return '<label class="option-row" for="' + esc(rid) + '"><input id="' + esc(rid) + '" data-answer-type="multi" type="checkbox" name="' + esc(name) + '" value="' + o.orig + '" ' + checked + ' /><span>' + esc(o.text) + "</span></label>";
      }).join("") + "</div>";
    } else if (c.q.format === "ordering") {
      const ord = Array.isArray(a) && a.length === (c.q.items || []).length ? a.slice() : (Array.isArray(c.m.orderingInitialOrder) ? c.m.orderingInitialOrder.slice() : seq((c.q.items || []).length));
      E.answerContainer.innerHTML = '<ul class="ordering-list">' + ord.map((orig) => (
        '<li class="ordering-item" draggable="true" data-orig-index="' + orig + '">' +
        '<span class="drag-handle" title="Drag">=</span><span>' + esc(c.q.items[orig]) + '</span>' +
        '<span class="order-controls"><button type="button" class="order-btn" data-move="up" data-orig-index="' + orig + '">^</button><button type="button" class="order-btn" data-move="down" data-orig-index="' + orig + '">v</button></span>' +
        '</li>'
      )).join("") + "</ul>";
    } else if (c.q.format === "fill_in_blank_constrained") {
      const ans = Array.isArray(a) ? a[0] : a;
      const name = "ans_blank_" + c.q.id;
      E.answerContainer.innerHTML = "<p><strong>Blank:</strong> " + esc(c.q.blank || "___") + '</p><div class="blank-choices">' + presentedChoices(c.q, c.m).map((x) => {
        const checked = String(ans || "") === String(x.text) ? "checked" : "";
        const rid = name + "_" + x.pos;
        return '<label class="option-row" for="' + esc(rid) + '"><input id="' + esc(rid) + '" data-answer-type="blank" type="radio" name="' + esc(name) + '" value="' + esc(x.text) + '" ' + checked + ' /><span>' + esc(x.text) + "</span></label>";
      }).join("") + "</div>";
    } else if (c.q.format === "match_pairs" || (c.q.format === "case_triage" && c.q.case_triage_variant === "match_pairs")) {
      const map = (a && typeof a === "object") ? a : {};
      const rights = presentedPairRights(c.q, c.m);
      E.answerContainer.innerHTML = '<div class="match-pairs-grid">' + (c.q.left_items || []).map((left) => {
        const opts = ['<option value="">Select</option>'].concat(rights.map((r) => '<option value="' + esc(r.text) + '" ' + (map[left] === r.text ? "selected" : "") + '>' + esc(r.text) + '</option>')).join("");
        return '<div class="pair-row"><div>' + esc(left) + '</div><div><select data-answer-type="pair" data-left="' + esc(left) + '">' + opts + '</select></div></div>';
      }).join("") + "</div>";
    } else {
      E.answerContainer.innerHTML = "<p>Unsupported format.</p>";
    }

    if (S.attempt.mode === "practice") { E.practiceTools.classList.remove("hidden"); renderPracticeFeedback(); }
    else { E.practiceTools.classList.add("hidden"); E.practiceFeedback.classList.add("hidden"); E.practiceFeedback.textContent = ""; }
  }

  function renderAssessment() {
    if (!S.attempt || S.attempt.status !== "in_progress") return;
    const n = S.attempt.selectedQuestions.length;
    if (!n) {
      S.attempt = null;
      try { if (S.storage) localStorage.removeItem(C2.localStorageKey); } catch (ignore) {}
      refreshLanding();
      E.landingError.textContent = "Saved attempt was invalid (0 questions). Please start a new assessment.";
      E.landingError.classList.remove("hidden");
      show("landing");
      return;
    }
    S.attempt.currentIndex = clamp(toInt(S.attempt.currentIndex, 0), 0, Math.max(0, n - 1));
    const answered = answeredCount();
    const pct = n ? Math.round((answered / n) * 1000) / 10 : 0;

    const stackText = S.attempt.selectedStacks.length ? S.attempt.selectedStacks.map(stackLabel).join(", ") : "General";
    E.assessmentContext.textContent = roleLabel(S.attempt.roleId) + " | " + stackText + " | " + (S.attempt.mode === "practice" ? "Practice" : "Assessment");
    E.progressLabel.textContent = "Q " + (S.attempt.currentIndex + 1) + " / " + n;
    E.answeredLabel.textContent = "Answered " + answered + " / " + n;
    E.answeredProgressBar.style.width = pct + "%";
    E.prevBtn.disabled = S.attempt.currentIndex <= 0;
    E.nextBtn.disabled = S.attempt.currentIndex >= n - 1;
    E.autosaveIndicator.textContent = !S.storage ? "Autosave unavailable" : (S.savedAt ? "Saved " + new Date(S.savedAt).toLocaleTimeString([], { hour12: false }) : "Saving enabled");
    E.timerLabel.textContent = S.attempt.mode === "assessment" ? fmtClock(toInt(S.attempt.remainingSeconds, 0)) : "Practice Mode (No Timer)";
    E.timeupBanner.classList.add("hidden");

    renderQuestion();
    renderNavigator();
  }
  function moveQuestion(delta) {
    if (!S.attempt || S.attempt.status !== "in_progress") return;
    S.attempt.currentIndex = clamp(toInt(S.attempt.currentIndex, 0) + delta, 0, S.attempt.selectedQuestions.length - 1);
    saveSoon();
    renderAssessment();
  }
  function updateOrdering(qid, order, meta) {
    S.attempt.answers[qid] = order.slice();
    if (!Array.isArray(meta.orderingInitialOrder)) meta.orderingInitialOrder = order.slice();
    saveSoon();
    renderQuestion();
    renderNavigator();
  }

  function startTimer() {
    stopTimer();
    if (!S.attempt || S.attempt.status !== "in_progress" || S.attempt.mode !== "assessment") return;
    S.attempt.lastUpdatedAt = Date.now();
    E.timerLabel.textContent = fmtClock(toInt(S.attempt.remainingSeconds, 0));
    S.tick = setInterval(onTick, 250);
  }
  function stopTimer() { if (S.tick) { clearInterval(S.tick); S.tick = null; } }
  function onTick() {
    if (!S.attempt || S.attempt.status !== "in_progress" || S.attempt.mode !== "assessment") return;
    const now = Date.now();
    const last = toNum(S.attempt.lastUpdatedAt, now);
    const dt = Math.floor((now - last) / 1000);
    if (dt <= 0) return;
    S.attempt.remainingSeconds = Math.max(0, toInt(S.attempt.remainingSeconds, 0) - dt);
    S.attempt.lastUpdatedAt = last + dt * 1000;
    E.timerLabel.textContent = fmtClock(S.attempt.remainingSeconds);
    saveSoon();
    if (S.attempt.remainingSeconds <= 0) triggerAutoSubmit();
  }
  function lockAssessmentUI(locked) {
    E.views.assessment.querySelectorAll("button,input,select").forEach((el) => { el.disabled = locked; });
  }
  function triggerAutoSubmit() {
    if (S.autoSubmitting) return;
    S.autoSubmitting = true;
    closeModal(false);
    flushHiddenTime();
    lockAssessmentUI(true);
    E.timeupBanner.classList.remove("hidden");
    setTimeout(() => submitAttempt(true), 700);
  }

  function openModal(title, msg, confirmLabel) {
    return new Promise((resolve) => {
      closeModal(false);
      S.modalResolve = resolve;
      E.modalTitle.textContent = title || "Confirm";
      E.modalMessage.textContent = msg || "";
      E.modalConfirm.textContent = confirmLabel || "Confirm";
      E.modalBackdrop.classList.remove("hidden");
      E.modalBackdrop.setAttribute("aria-hidden", "false");
      E.modalConfirm.focus();
    });
  }
  function closeModal(val) {
    if (!E.modalBackdrop.classList.contains("hidden")) {
      E.modalBackdrop.classList.add("hidden");
      E.modalBackdrop.setAttribute("aria-hidden", "true");
    }
    if (S.modalResolve) {
      const fn = S.modalResolve;
      S.modalResolve = null;
      fn(!!val);
    }
  }

  function renderPracticeFeedback() {
    if (!S.attempt || S.attempt.mode !== "practice") { E.practiceFeedback.classList.add("hidden"); E.practiceFeedback.textContent = ""; return; }
    const c = currentCtx();
    if (!c) return;
    if (!S.attempt.checkedQuestions[c.q.id]) { E.practiceFeedback.classList.add("hidden"); E.practiceFeedback.textContent = ""; return; }
    const s = scoreQuestion(c.q, S.attempt.answers[c.q.id]);
    const prefix = s.normalized >= 0.999 ? "Correct." : (s.normalized > 0 ? "Partially correct." : "Incorrect.");
    E.practiceFeedback.textContent = prefix + " " + c.q.explanation;
    E.practiceFeedback.classList.remove("hidden");
    E.practiceFeedback.classList.toggle("incorrect", s.normalized < 0.999);
  }

  async function onStart() {
    const role = (C2.roles || {})[S.selectedRole];
    if (!role) { E.landingError.textContent = "Select a role before starting."; E.landingError.classList.remove("hidden"); return; }
    if (STACK_REQUIRED && !S.selectedStacks.length) { E.landingError.textContent = "Select at least one stack before starting."; E.landingError.classList.remove("hidden"); return; }

    refreshLanding();
    const allowOverride = !!C2.allowAdminOverride;
    const override = allowOverride && E.adminOverrideToggle && E.adminOverrideToggle.checked;
    if (!S.diag.ok && !override) {
      E.landingError.textContent = S.diag.errors.length ? S.diag.errors[0].message : "Cannot start due to diagnostics.";
      E.landingError.classList.remove("hidden");
      return;
    }

    if (S.attempt && S.attempt.status === "in_progress") {
      const ok = await openModal("Replace In-Progress Attempt", "A saved in-progress attempt exists. Replace it and start a new one?", "Replace");
      if (!ok) return;
      clearAll();
    }

    try {
      const practice = !!C2.practiceModeEnabled && !!E.practiceToggle.checked;
      S.attempt = buildAttempt(practice, override);
      S.result = null;
      S.savedAt = null;
      saveNow();
      show("assessment");
      renderAssessment();
      if (S.attempt.mode === "assessment") startTimer();
    } catch (e) {
      E.landingError.textContent = "Start failed: " + e.message;
      E.landingError.classList.remove("hidden");
      show("landing");
      renderLanding();
    }
  }

  function onResume() {
    if (!S.attempt || S.attempt.status !== "in_progress") return;
    if (ROLE_IDS.includes(S.attempt.roleId)) S.selectedRole = S.attempt.roleId;
    if (Array.isArray(S.attempt.selectedStacks)) S.selectedStacks = S.attempt.selectedStacks.filter((s) => STACKS.includes(s));
    if (S.attempt.mode === "assessment" && toInt(S.attempt.remainingSeconds, 0) <= 0) { triggerAutoSubmit(); return; }
    show("assessment");
    renderAssessment();
    if (S.attempt.mode === "assessment") startTimer();
  }

  async function onSubmitClick() {
    if (!S.attempt || S.attempt.status !== "in_progress") return;
    const miss = unansweredCount();
    let msg = "Submit now? You cannot change answers after submission.";
    if (miss > 0) msg += "\nYou have " + miss + " unanswered question(s). Submit anyway?";
    const ok = await openModal("Confirm Submission", msg, "Submit");
    if (!ok) return;
    submitAttempt(false);
  }

  async function submitAttempt(auto) {
    if (!S.attempt || S.attempt.status !== "in_progress") return;
    stopTimer();
    flushHiddenTime();
    if (S.attempt.mode === "assessment" && auto) S.attempt.remainingSeconds = 0;
    S.attempt.status = "submitted";
    S.attempt.endedAt = new Date().toISOString();
    S.attempt.lastUpdatedAt = Date.now();
    S.result = buildResult();
    S.autoSubmitting = false;
    E.timeupBanner.classList.add("hidden");
    lockAssessmentUI(false);
    saveNow();
    show("results");
    renderResults();
  }

  function renderResults() {
    if (!S.result) return;
    const r = S.result;
    const isPass = !!(r.totals && r.totals.pass);
    const isBorderline = !!(r.totals && r.totals.borderlineReview);
    E.resultPercent.textContent = toNum(r.totals.percent, 0).toFixed(1) + "%";
    E.resultPoints.textContent = toNum(r.totals.pointsEarned, 0) + " / " + toNum(r.totals.pointsPossible, 0);
    E.resultPassBadge.textContent = isPass ? "Pass" : (isBorderline ? "Borderline (Review)" : "Fail");
    E.resultPassBadge.classList.toggle("pass", isPass);
    E.resultPassBadge.classList.toggle("borderline", !isPass && isBorderline);
    E.resultPassBadge.classList.toggle("fail", !isPass && !isBorderline);
    E.resultTime.textContent = fmtClock(toInt(r.timeUsedSeconds, 0));
    E.resultRole.textContent = r.roleLabel || roleLabel(r.roleId);
    const stackText = Array.isArray(r.selectedStacks) && r.selectedStacks.length ? r.selectedStacks.map(stackLabel).join(", ") : "General";
    E.resultStacks.textContent = stackText;
    const pp = toInt(r.passPercent, 0);
    const rb = Math.max(0, toInt(r.reviewBandPercent, 0));
    E.resultPassTarget.textContent = rb > 0 ? ("Pass >= " + pp + "% | Review " + Math.max(0, pp - rb) + "% to " + (pp - 0.1).toFixed(1) + "%") : (pp + "%");
    E.resultOverride.textContent = r.overrideUsed ? "Yes" : "No";
    E.resultSeed.textContent = String(r.seed);
    E.resultStart.textContent = fmtDate(r.timestampStart);
    E.resultEnd.textContent = fmtDate(r.timestampEnd);

    if (C2.showAttentionMetricsOnResults) {
      E.attentionPanel.classList.remove("hidden");
      E.attentionTabHidden.textContent = String(toInt(r.attentionEvents.tabHiddenCount, 0));
      E.attentionTabHiddenSeconds.textContent = String(toInt(r.attentionEvents.tabHiddenSeconds, 0));
      E.attentionCopy.textContent = String(toInt(r.attentionEvents.copyEventCount, 0));
      E.attentionPaste.textContent = String(toInt(r.attentionEvents.pasteEventCount, 0));
    } else {
      E.attentionPanel.classList.add("hidden");
    }

    E.breakdownBody.innerHTML = Object.keys(r.breakdownByCategory || {}).sort().map((k) => {
      const b = r.breakdownByCategory[k];
      return "<tr><td>" + esc(k) + "</td><td>" + toInt(b.correctCount, 0) + " / " + toInt(b.totalCount, 0) + "</td><td>" + toNum(b.percent, 0).toFixed(1) + "%</td></tr>";
    }).join("");

    E.reviewList.innerHTML = (r.perQuestion || []).map((x, i) => {
      const log = x.log_snippet ? '<pre class="question-log"><code>' + esc(x.log_snippet) + "</code></pre>" : "";
      return '<article class="review-item ' + (x.isCorrect ? "correct" : "incorrect") + '">' +
        '<div class="review-head"><strong>Q ' + (i + 1) + " - " + esc(x.id) + '</strong><span class="review-mark ' + (x.isCorrect ? "correct" : "incorrect") + '">' + (x.isCorrect ? "Correct" : "Incorrect") + "</span></div>" +
        "<p><strong>Stack:</strong> " + esc(stackLabel(x.tech_stack)) + "</p>" +
        "<p><strong>Category:</strong> " + esc(x.category) + "</p>" +
        "<p><strong>Format:</strong> " + esc(formatLabel(x.format)) + " | <strong>Difficulty:</strong> D" + esc(x.difficulty) + "</p>" +
        "<p><strong>Question:</strong><br>" + promptHtml(x.question_text, x) + "</p>" +
        log +
        "<p><strong>Your answer:</strong> " + esc(fmtAnswer(x.userAnswer)) + "</p>" +
        "<p><strong>Correct answer:</strong> " + esc(fmtAnswer(x.correctAnswer)) + "</p>" +
        "<p><strong>Explanation:</strong> " + esc(x.explanation) + "</p>" +
        "<p><strong>Points:</strong> " + toNum(x.pointsEarned, 0) + " / " + toNum(x.pointsPossible, 0) + "</p>" +
        "</article>";
    }).join("");
  }

  function csvEscape(v) { const t = String(v == null ? "" : v); return /[",\r\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }
  function buildCsv(r) {
    const headers = ["roleId", "roleLabel", "selectedStacks", "seed", "questionId", "tech_stack", "category", "format", "difficulty", "isCorrect", "pointsEarned", "pointsPossible", "userAnswer", "correctAnswer"];
    const lines = [headers.map(csvEscape).join(",")];
    (r.perQuestion || []).forEach((x) => {
      lines.push([
        r.roleId,
        r.roleLabel,
        (r.selectedStacks || []).join("|"),
        String(r.seed),
        x.id,
        x.tech_stack,
        x.category,
        x.format,
        String(x.difficulty),
        x.isCorrect ? "true" : "false",
        String(x.pointsEarned),
        String(x.pointsPossible),
        fmtAnswer(x.userAnswer),
        fmtAnswer(x.correctAnswer)
      ].map(csvEscape).join(","));
    });
    return lines.join("\r\n");
  }
  function stamp(iso) {
    const d = new Date(iso || Date.now());
    return d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + "_" + String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0") + String(d.getSeconds()).padStart(2, "0");
  }
  function download(name, text, mime) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  function resultPrefix(r) { return "result_" + slug(r.roleId || r.roleLabel) + "_seed" + String(r.seed); }

  async function onDownloadJson() {
    if (!S.result) return;
    if (S.result.practiceMode) { const ok = await openModal("Practice Attempt Export", "This is a practice attempt. Export anyway?", "Export"); if (!ok) return; }
    const p = resultPrefix(S.result);
    download(p + "_" + stamp(S.result.timestampEnd) + ".json", JSON.stringify(S.result, null, 2), "application/json");
  }
  async function onCopyJson() {
    if (!S.result) return;
    if (S.result.practiceMode) { const ok = await openModal("Practice Attempt Export", "This is a practice attempt. Copy JSON anyway?", "Copy"); if (!ok) return; }
    const txt = JSON.stringify(S.result, null, 2);
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) { try { await navigator.clipboard.writeText(txt); copied = true; } catch (e) { copied = false; } }
    if (!copied) {
      const ta = document.createElement("textarea");
      ta.value = txt;
      ta.setAttribute("readonly", "readonly");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { copied = document.execCommand("copy"); } catch (e) { copied = false; }
      document.body.removeChild(ta);
    }
    const orig = E.copyJsonBtn.textContent;
    E.copyJsonBtn.textContent = copied ? "JSON Copied" : "Copy Failed";
    setTimeout(() => { E.copyJsonBtn.textContent = orig; }, 1500);
  }
  async function onDownloadCsv() {
    if (!S.result) return;
    if (S.result.practiceMode) { const ok = await openModal("Practice Attempt Export", "This is a practice attempt. Export anyway?", "Export"); if (!ok) return; }
    const p = resultPrefix(S.result);
    download(p + "_" + stamp(S.result.timestampEnd) + ".csv", buildCsv(S.result), "text/csv;charset=utf-8");
  }
  async function onStartNew() {
    const ok = await openModal("Start New Attempt", "Start new attempt now? This clears saved progress and previous results.", "Start New");
    if (!ok) return;
    clearAll();
    show("landing");
    renderLanding();
  }

  function bind() {
    E.roleSelect.addEventListener("change", () => {
      S.selectedRole = E.roleSelect.value || DEFAULT_ROLE;
      E.landingError.classList.add("hidden");
      renderLandingRules();
      renderRoleSummary();
      refreshLanding();
    });

    E.stackOptions.addEventListener("change", (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLInputElement)) return;
      const s = String(t.dataset.stack || "");
      if (!STACKS.includes(s)) return;
      if (t.checked) { if (!S.selectedStacks.includes(s)) S.selectedStacks.push(s); }
      else S.selectedStacks = S.selectedStacks.filter((x) => x !== s);
      S.selectedStacks = STACKS.filter((x) => S.selectedStacks.includes(x));
      E.landingError.classList.add("hidden");
      refreshLanding();
    });

    if (E.adminOverrideToggle) E.adminOverrideToggle.addEventListener("change", refreshLanding);

    E.startBtn.addEventListener("click", onStart);
    E.resumeBtn.addEventListener("click", onResume);
    E.openDiagnosticsBtn.addEventListener("click", () => { refreshLanding(); show("diagnostics"); });
    E.diagBackBtn.addEventListener("click", () => { show("landing"); renderLanding(); });

    E.exportTemplateBtn.addEventListener("click", () => {
      const template = [{
        id: "RPA-0001",
        role_level_min: "SE",
        role_level_max: null,
        senior_only: false,
        lead_only: false,
        tech_stack: "UiPath",
        category: "Exception Handling & Retries",
        difficulty: 3,
        format: "log_analysis_single_choice",
        points: 2,
        time_estimate_seconds: 120,
        question_text: "A queue item fails twice with timeout then succeeds. What is the best conclusion?",
        options: ["Permanent business error", "Transient system issue recovered by bounded retry", "Security event", "No issue"],
        correct_answer: ["B"],
        scoring_method: "all_or_nothing",
        explanation: "Two transient failures followed by success indicate bounded-retry recovery.",
        rationale: "Tests log-based troubleshooting judgement."
      }];
      download("question_bank_template_v2.json", JSON.stringify(template, null, 2), "application/json");
    });

    E.prevBtn.addEventListener("click", () => moveQuestion(-1));
    E.nextBtn.addEventListener("click", () => moveQuestion(1));
    E.submitBtn.addEventListener("click", onSubmitClick);

    E.questionGrid.addEventListener("click", (ev) => {
      const t = ev.target instanceof Element ? ev.target.closest("button[data-nav-index]") : null;
      if (!t || !S.attempt || S.attempt.status !== "in_progress") return;
      const idx = toInt(t.getAttribute("data-nav-index"), NaN);
      if (!Number.isInteger(idx)) return;
      S.attempt.currentIndex = clamp(idx, 0, S.attempt.selectedQuestions.length - 1);
      saveSoon();
      renderAssessment();
    });

    E.answerContainer.addEventListener("change", (ev) => {
      if (!S.attempt || S.attempt.status !== "in_progress") return;
      const c = currentCtx();
      if (!c) return;
      const t = ev.target;
      if (!(t instanceof HTMLInputElement || t instanceof HTMLSelectElement)) return;

      if (t instanceof HTMLInputElement && t.dataset.answerType === "single") {
        const v = toInt(t.value, NaN);
        if (Number.isInteger(v)) S.attempt.answers[c.q.id] = v;
      } else if (t instanceof HTMLInputElement && t.dataset.answerType === "multi") {
        const vals = Array.from(E.answerContainer.querySelectorAll('input[data-answer-type="multi"]:checked')).map((x) => toInt(x.value, NaN)).filter((x) => Number.isInteger(x)).sort((a, b) => a - b);
        S.attempt.answers[c.q.id] = vals;
      } else if (t instanceof HTMLInputElement && t.dataset.answerType === "blank") {
        S.attempt.answers[c.q.id] = t.value;
      } else if (t instanceof HTMLSelectElement && t.dataset.answerType === "pair") {
        const left = String(t.dataset.left || "");
        if (!left) return;
        const map = (S.attempt.answers[c.q.id] && typeof S.attempt.answers[c.q.id] === "object") ? clone(S.attempt.answers[c.q.id]) : {};
        if (t.value) map[left] = t.value; else delete map[left];
        S.attempt.answers[c.q.id] = map;
      } else return;

      saveSoon();
      renderNavigator();
      if (S.attempt.mode === "practice") renderPracticeFeedback();
    });

    E.answerContainer.addEventListener("click", (ev) => {
      if (!S.attempt || S.attempt.status !== "in_progress") return;
      const t = ev.target instanceof Element ? ev.target.closest("button[data-move]") : null;
      if (!t) return;
      const c = currentCtx();
      if (!c || c.q.format !== "ordering") return;
      const orig = toInt(t.getAttribute("data-orig-index"), NaN);
      const dir = String(t.getAttribute("data-move") || "");
      const ord = (S.attempt.answers[c.q.id] || []).slice();
      const p = ord.indexOf(orig);
      const np = dir === "up" ? p - 1 : p + 1;
      if (p < 0 || np < 0 || np >= ord.length) return;
      const tmp = ord[p]; ord[p] = ord[np]; ord[np] = tmp;
      updateOrdering(c.q.id, ord, c.m);
    });

    E.answerContainer.addEventListener("dragstart", (ev) => {
      const t = ev.target instanceof Element ? ev.target.closest(".ordering-item") : null;
      if (!t || !ev.dataTransfer) return;
      t.classList.add("dragging");
      ev.dataTransfer.effectAllowed = "move";
      ev.dataTransfer.setData("text/plain", t.getAttribute("data-orig-index") || "");
    });
    E.answerContainer.addEventListener("dragover", (ev) => { if (ev.target instanceof Element && ev.target.closest(".ordering-item")) ev.preventDefault(); });
    E.answerContainer.addEventListener("drop", (ev) => {
      const t = ev.target instanceof Element ? ev.target.closest(".ordering-item") : null;
      if (!t || !ev.dataTransfer) return;
      ev.preventDefault();
      const c = currentCtx();
      if (!c || c.q.format !== "ordering") return;
      const from = toInt(ev.dataTransfer.getData("text/plain"), NaN);
      const to = toInt(t.getAttribute("data-orig-index"), NaN);
      if (!Number.isInteger(from) || !Number.isInteger(to) || from === to) return;
      const ord = (S.attempt.answers[c.q.id] || []).slice();
      const fp = ord.indexOf(from), tp = ord.indexOf(to);
      if (fp < 0 || tp < 0) return;
      ord.splice(fp, 1);
      ord.splice(tp, 0, from);
      updateOrdering(c.q.id, ord, c.m);
    });
    E.answerContainer.addEventListener("dragend", () => { Array.from(E.answerContainer.querySelectorAll(".ordering-item.dragging")).forEach((x) => x.classList.remove("dragging")); });

    E.checkAnswerBtn.addEventListener("click", () => {
      const c = currentCtx();
      if (!c || !S.attempt || S.attempt.mode !== "practice") return;
      S.attempt.checkedQuestions[c.q.id] = true;
      saveSoon();
      renderPracticeFeedback();
    });

    E.downloadJsonBtn.addEventListener("click", onDownloadJson);
    E.copyJsonBtn.addEventListener("click", onCopyJson);
    E.downloadCsvBtn.addEventListener("click", onDownloadCsv);
    E.startNewBtn.addEventListener("click", onStartNew);

    E.modalConfirm.addEventListener("click", () => closeModal(true));
    E.modalCancel.addEventListener("click", () => closeModal(false));
    E.modalBackdrop.addEventListener("click", (ev) => { if (ev.target === E.modalBackdrop) closeModal(false); });

    window.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && !E.modalBackdrop.classList.contains("hidden")) { closeModal(false); return; }
      if (!S.attempt || S.attempt.status !== "in_progress") return;
      if (E.views.assessment.classList.contains("hidden")) return;
      if (!E.modalBackdrop.classList.contains("hidden")) return;
      if (ev.altKey && ev.key === "ArrowLeft") { ev.preventDefault(); moveQuestion(-1); }
      else if (ev.altKey && ev.key === "ArrowRight") { ev.preventDefault(); moveQuestion(1); }
      else if (ev.ctrlKey && ev.key === "Enter") {
        ev.preventDefault();
        if (S.attempt.mode === "practice") {
          const c = currentCtx();
          if (!c) return;
          S.attempt.checkedQuestions[c.q.id] = true;
          saveSoon();
          renderPracticeFeedback();
        } else onSubmitClick();
      }
    });

    window.addEventListener("beforeunload", (ev) => {
      if (S.attempt && S.attempt.status === "in_progress") { ev.preventDefault(); ev.returnValue = ""; }
    });

    document.addEventListener("visibilitychange", () => {
      if (!S.attempt || S.attempt.status !== "in_progress" || S.attempt.mode !== "assessment") return;
      if (document.visibilityState === "hidden") { S.attempt.attention.tabHiddenCount += 1; S.hiddenAt = Date.now(); }
      else flushHiddenTime();
      saveSoon();
    });
    document.addEventListener("copy", () => {
      if (!S.attempt || S.attempt.status !== "in_progress" || S.attempt.mode !== "assessment") return;
      S.attempt.attention.copyEventCount += 1;
      saveSoon();
    });
    document.addEventListener("paste", () => {
      if (!S.attempt || S.attempt.status !== "in_progress" || S.attempt.mode !== "assessment") return;
      S.attempt.attention.pasteEventCount += 1;
      saveSoon();
    });
  }

  function init() {
    cache();
    bind();

    S.storage = testStorage();
    if (!S.storage) {
      E.storageWarning.textContent = "LocalStorage unavailable. Autosave/resume will not persist.";
      E.storageWarning.classList.remove("hidden");
    }

    loadState();
    if (!S.selectedRole && DEFAULT_ROLE) S.selectedRole = DEFAULT_ROLE;
    if (!S.selectedStacks.length) S.selectedStacks = [];

    if (S.attempt && S.attempt.status === "submitted" && !S.result) { S.result = buildResult(); saveNow(); }
    if (S.attempt && S.attempt.status === "in_progress" && S.attempt.mode === "assessment" && toInt(S.attempt.remainingSeconds, 0) <= 0) {
      S.attempt.remainingSeconds = 0;
      S.attempt.status = "submitted";
      S.attempt.endedAt = new Date().toISOString();
      S.result = buildResult();
      saveNow();
    }

    if (S.attempt && S.attempt.status === "submitted" && S.result) {
      show("results");
      renderResults();
    } else {
      show("landing");
      renderLanding();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

