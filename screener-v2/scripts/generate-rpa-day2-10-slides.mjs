import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pptxgen from "pptxgenjs";

const rootDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const exportsDir = path.join(rootDir, "exports");
const pptxPath = path.join(exportsDir, "day2-rpa-10-slides-business-analysts.pptx");

const pptx = { ShapeType: new pptxgen().ShapeType };

const COLORS = {
  ink: "071321",
  navy: "0D223F",
  navy2: "153357",
  blue: "1E73FF",
  blueSoft: "8BBCFF",
  teal: "11B5A4",
  tealSoft: "DDF7F3",
  slateBg: "F3F7FB",
  slateLine: "C8D7EA",
  slateText: "55657E",
  text: "102749",
  white: "FFFFFF",
  amber: "E6A019",
  amberSoft: "FFF5E2",
  crimson: "D6455D",
  crimsonSoft: "FDECEF",
  green: "1FA86C",
  greenSoft: "E5F7EF"
};

const FONT_HEAD = "Aptos Display";
const FONT_BODY = "Aptos";

const slides = [
  {
    title: "How RPA Actually Works",
    subtitle: "A production bot is a controlled runtime flow, not just UI clicking",
    kicker: "Day 2 - How RPA Works",
    takeaway: "A bot is a controlled runtime workflow, not a macro with branding.",
    layout: "cover",
    bullets: [
      "Trigger handling",
      "Execution orchestration",
      "Transaction acquisition",
      "System interaction",
      "Rule evaluation",
      "Exception handling",
      "Result persistence",
      "Reporting and audit evidence"
    ],
    notes:
      "Open by reframing RPA away from the demo stereotype. The audience should leave this slide understanding that real automation has controls, runtime discipline, and measurable outputs."
  },
  {
    title: "The Core Automation Control Model",
    subtitle: "Every serious automation can be understood through four control points",
    kicker: "Control Model",
    takeaway: "If any of these are vague, the process is not automation-ready.",
    layout: "four-blocks",
    blocks: [
      {
        title: "Trigger",
        items: ["Scheduler", "Queue availability", "Inbound file", "User action", "API / webhook event"]
      },
      {
        title: "Input",
        items: ["Structured records", "Excel or report extracts", "UI state", "Database rows", "API payloads"]
      },
      {
        title: "Rules",
        items: ["Validations", "Routing logic", "Transformations", "Matching logic", "Exception thresholds"]
      },
      {
        title: "Output",
        items: ["Updated records", "Notes and statuses", "Reports", "Database state changes", "Exception logs"]
      }
    ],
    notes:
      "Teach this as a practical BA framework. If the trigger, input, rules, or output model is unclear, build quality and supportability will both suffer."
  },
  {
    title: "Orchestration Is the Control Layer",
    subtitle: "Scheduling is only one part of orchestration",
    kicker: "Orchestration",
    takeaway: "Orchestration turns isolated automation steps into a reliable operating flow.",
    layout: "hub",
    bullets: [
      "Sequences workflow steps",
      "Manages state transitions",
      "Coordinates components",
      "Acquires and releases work",
      "Routes success and failure paths",
      "Applies retry logic",
      "Guarantees cleanup",
      "Improves observability and governance"
    ],
    notes:
      "Position orchestration as the layer that makes a solution operational. The value is control, visibility, sequencing, and recoverability."
  },
  {
    title: "Why Transaction-Based Processing Matters",
    subtitle: "Mature RPA handles work item by item, not as one undifferentiated batch",
    kicker: "Transaction Design",
    takeaway: "Transactionization makes automation scalable, measurable, and recoverable.",
    layout: "transaction",
    leftTitle: "A transaction item should have",
    leftItems: [
      "Unique identifier",
      "Business context",
      "Status",
      "Retry count",
      "Timestamps",
      "Result fields",
      "Error state"
    ],
    rightTitle: "Why it matters",
    rightItems: [
      "Failure becomes item-level, not file-level",
      "Retry is granular",
      "Monitoring is precise",
      "Outputs are traceable",
      "Concurrency and locking become manageable"
    ],
    notes:
      "Connect transaction-based processing to supportability and reporting. BAs should understand the unit of work because it shapes monitoring, retry logic, and business review."
  },
  {
    title: "Business Exceptions vs System Exceptions",
    subtitle: "This is the most important runtime distinction in automation delivery",
    kicker: "Exceptions",
    takeaway:
      "If you treat business and system exceptions the same way, your bot will either retry nonsense or fail too early.",
    layout: "two-panel",
    panels: [
      {
        title: "Business Exception",
        accent: "amber",
        items: [
          "Expected rule-based outcome",
          "The process ran correctly, but the case cannot proceed normally",
          "Examples: claim not found, subscriber mismatch, data mismatch",
          "Normal behavior: no retry, mark and route appropriately"
        ]
      },
      {
        title: "System Exception",
        accent: "crimson",
        items: [
          "Technical or runtime failure",
          "The process could not complete because execution broke",
          "Examples: timeout, browser crash, missing element, session expiry",
          "Normal behavior: retry with recovery up to a defined threshold"
        ]
      }
    ],
    notes:
      "This slide is central. The audience should clearly understand that business exceptions are valid outcomes to route, while system exceptions are technical failures to recover or escalate."
  },
  {
    title: "Retry Is a Control Strategy, Not a Reflex",
    subtitle: "A proper retry model classifies failures and applies recovery intentionally",
    kicker: "Retry and Recovery",
    takeaway: "Retry without classification is noise. Retry with recovery is resilience.",
    layout: "process",
    bullets: [
      "What is retriable",
      "How many attempts are allowed",
      "What recovery happens between attempts",
      "When the item becomes terminal failure",
      "What evidence is logged"
    ],
    steps: [
      "System exception occurs",
      "Retry counter increments",
      "Browser or session recovery runs",
      "Transaction is reattempted",
      "Threshold exhaustion moves item to failure state"
    ],
    notes:
      "Explain that recovery matters as much as retry count. Without classification and reset logic, retries simply repeat the same failure."
  },
  {
    title: "A Better RPA Architecture Pattern",
    subtitle: "Stronger automation separates responsibilities into controlled layers",
    kicker: "Architecture Pattern",
    takeaway: "One monolithic bot is easy to demo and hard to support.",
    layout: "architecture",
    layers: [
      {
        title: "Dispatcher / Intake Layer",
        items: ["Acquires source data", "Normalizes input", "Creates transaction-ready records"]
      },
      {
        title: "Performer / Processing Layer",
        items: ["Reads work item by work item", "Applies business logic", "Extracts or updates data", "Classifies outcomes"]
      },
      {
        title: "Write-Back / Finalization Layer",
        items: ["Updates target systems", "Finalizes records", "Produces summary outputs"]
      },
      {
        title: "Reporting / Audit Layer",
        items: ["Logs outcomes", "Exposes exceptions", "Produces reviewable business outputs"]
      }
    ],
    notes:
      "Use this to show how maintainability comes from separation of concerns. It also gives the BA a better mental model for where controls and outputs belong."
  },
  {
    title: "Where APIs Fit Into RPA",
    subtitle: "The best integration path is not always the UI",
    kicker: "API in Automation",
    takeaway: "The best solution is not UI-first. The best solution is control-first.",
    layout: "two-column-detail",
    leftTitle: "API advantages",
    leftItems: [
      "Faster than UI automation",
      "More reliable",
      "Background-friendly",
      "Structured request and response model",
      "Clearer error handling",
      "Easier to scale and maintain"
    ],
    rightTitle: "Common API uses in automation",
    rightItems: [
      "Retrieve records directly",
      "Create or update records",
      "Fetch statuses or metadata",
      "Push results to downstream systems",
      "Trigger workflows"
    ],
    notes:
      "Make the audience comfortable with a mixed automation model. RPA should not be framed as screen-only when cleaner interfaces are available."
  },
  {
    title: "API Basics Business Analysts Should Understand",
    subtitle: "APIs move structured data between systems without imitating a user",
    kicker: "API Basics",
    takeaway:
      "API automation exchanges structured data with the system instead of reading screens and imitating a user.",
    layout: "api-basics",
    requestItems: [
      "Endpoint or URL",
      "HTTP method: GET, POST, PUT, PATCH, DELETE",
      "Headers",
      "Authentication token",
      "Parameters",
      "Request body or payload"
    ],
    responseItems: ["Status code", "Response body, usually JSON or XML", "Error details"],
    whyItems: [
      "APIs define what data can move directly between systems",
      "API errors are usually more explicit than UI failures",
      "Process design changes when direct system integration is available"
    ],
    notes:
      "Keep this BA-friendly. The goal is not technical mastery but enough understanding to recognize when API availability changes the delivery design."
  },
  {
    title: "The BA's Real Job in Automation Design",
    subtitle: "High-value analysis defines control, exception logic, and measurable outcomes",
    kicker: "BA Role",
    takeaway:
      "Good automation analysis is not just process mapping. It is process control, exception logic, and outcome design.",
    layout: "closing",
    defineItems: [
      "Trigger model",
      "Unit of work or transaction",
      "Inputs and source systems",
      "Rules and decision points",
      "Exception scenarios",
      "Retry boundaries",
      "Outputs and target systems",
      "Review and reporting expectations",
      "Manual fallback path",
      "Success criteria"
    ],
    questionItems: [
      "What is the unit of work?",
      "What counts as success?",
      "What should be retried?",
      "What should be routed to human review?",
      "What must be persisted for auditability?",
      "What is the source of truth for status?"
    ],
    notes:
      "End with a strong message about the BA role. The audience should feel that their contribution is central to automation quality, not peripheral."
  }
];

function bg(slide, dark = false) {
  slide.background = { color: dark ? COLORS.ink : COLORS.slateBg };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: dark ? COLORS.ink : COLORS.slateBg },
    line: { color: dark ? COLORS.ink : COLORS.slateBg, transparency: 100 }
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: dark ? -0.3 : 10.6,
    y: dark ? -0.8 : -0.25,
    w: dark ? 4.4 : 3.2,
    h: dark ? 3.4 : 2.2,
    fill: { color: dark ? COLORS.blue : COLORS.blueSoft, transparency: dark ? 80 : 86 },
    line: { color: COLORS.blue, transparency: 100 }
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: dark ? 9.6 : -0.6,
    y: dark ? -0.4 : 5.8,
    w: dark ? 3.8 : 2.5,
    h: dark ? 3 : 1.8,
    fill: { color: dark ? COLORS.teal : COLORS.teal, transparency: dark ? 84 : 92 },
    line: { color: COLORS.teal, transparency: 100 }
  });
  if (!dark) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 0.42,
      fill: { color: COLORS.navy },
      line: { color: COLORS.navy, transparency: 100 }
    });
  }
}

function header(slide, data, idx, dark = false) {
  slide.addText(data.kicker.toUpperCase(), {
    x: 0.72,
    y: dark ? 0.48 : 0.2,
    w: 3.2,
    h: 0.18,
    fontFace: FONT_BODY,
    fontSize: 8.5,
    bold: true,
    color: dark ? COLORS.blueSoft : COLORS.blueSoft,
    charSpace: 1.1,
    margin: 0
  });
  slide.addText(data.title, {
    x: 0.72,
    y: dark ? 0.88 : 0.68,
    w: dark ? 6.1 : 7.7,
    h: 0.48,
    fontFace: FONT_HEAD,
    fontSize: dark ? 28 : 24,
    bold: true,
    color: dark ? COLORS.white : COLORS.text,
    margin: 0
  });
  slide.addText(data.subtitle, {
    x: 0.72,
    y: dark ? 1.58 : 1.16,
    w: dark ? 6.3 : 8.5,
    h: 0.38,
    fontFace: FONT_BODY,
    fontSize: dark ? 12.2 : 10.8,
    color: dark ? "DCE9FF" : COLORS.slateText,
    margin: 0
  });
  slide.addText(String(idx).padStart(2, "0"), {
    x: 12.08,
    y: dark ? 0.56 : 0.58,
    w: 0.5,
    h: 0.18,
    fontFace: FONT_BODY,
    fontSize: 9,
    color: dark ? COLORS.blueSoft : COLORS.slateText,
    align: "right",
    margin: 0
  });
}

function takeaway(slide, text, x, y, w, tone = "blue", dark = false) {
  const accent =
    tone === "amber" ? COLORS.amber : tone === "crimson" ? COLORS.crimson : tone === "teal" ? COLORS.teal : COLORS.blue;
  const fill = dark ? COLORS.navy2 : COLORS.white;
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 0.88,
    rectRadius: 0.05,
    fill: { color: fill, transparency: dark ? 8 : 0 },
    line: { color: accent, pt: 1.2 }
  });
  slide.addText("Key line", {
    x: x + 0.16,
    y: y + 0.12,
    w: 0.9,
    h: 0.16,
    fontFace: FONT_BODY,
    fontSize: 8,
    bold: true,
    color: accent,
    margin: 0
  });
  slide.addText(text, {
    x: x + 0.16,
    y: y + 0.3,
    w: w - 0.3,
    h: 0.42,
    fontFace: FONT_BODY,
    fontSize: 9.4,
    color: dark ? COLORS.white : COLORS.text,
    margin: 0
  });
}

function addList(slide, items, x, y, w, fontSize = 10.2, gap = 0.38, color = COLORS.text, bullet = COLORS.blue) {
  items.forEach((item, i) => {
    const top = y + i * gap;
    slide.addShape(pptx.ShapeType.ellipse, {
      x,
      y: top + 0.08,
      w: 0.1,
      h: 0.1,
      fill: { color: bullet },
      line: { color: bullet, transparency: 100 }
    });
    slide.addText(item, {
      x: x + 0.18,
      y: top,
      w,
      h: 0.24,
      fontFace: FONT_BODY,
      fontSize,
      color,
      margin: 0
    });
  });
}

function card(slide, title, items, x, y, w, h, accent = COLORS.blue, fill = COLORS.white, titleColor = COLORS.text, bodyColor = COLORS.text) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.05,
    fill: { color: fill },
    line: { color: accent, pt: 1.1 }
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.07,
    fill: { color: accent },
    line: { color: accent, transparency: 100 }
  });
  slide.addText(title, {
    x: x + 0.16,
    y: y + 0.16,
    w: w - 0.3,
    h: 0.18,
    fontFace: FONT_HEAD,
    fontSize: 11.5,
    bold: true,
    color: titleColor,
    margin: 0
  });
  addList(slide, items, x + 0.16, y + 0.5, w - 0.44, 9.1, 0.31, bodyColor, accent);
}

function cover(slide, data, idx) {
  bg(slide, true);
  header(slide, data, idx, true);
  takeaway(slide, data.takeaway, 0.72, 2.18, 5.92, "teal", true);

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.72,
    y: 3.32,
    w: 5.92,
    h: 2.7,
    rectRadius: 0.05,
    fill: { color: COLORS.navy2, transparency: 8 },
    line: { color: COLORS.blueSoft, transparency: 72, pt: 1 }
  });
  addList(slide, data.bullets, 0.98, 3.64, 5.2, 10.1, 0.28, COLORS.white, COLORS.teal);

  card(
    slide,
    "Runtime control stack",
    ["Trigger", "Orchestration", "Transactions", "Rules", "Exceptions", "Persistence", "Reporting"],
    7.1,
    1.1,
    2.3,
    4.8,
    COLORS.blue,
    COLORS.navy2,
    COLORS.white,
    "DCE9FF"
  );
  card(
    slide,
    "Business analyst lens",
    ["What starts it?", "What is the unit of work?", "What counts as success?", "What gets reviewed?"],
    9.75,
    1.9,
    2.8,
    3.2,
    COLORS.teal,
    COLORS.navy2,
    COLORS.white,
    "DCE9FF"
  );
}

function fourBlocks(slide, data, idx) {
  bg(slide);
  header(slide, data, idx);
  takeaway(slide, data.takeaway, 9.08, 0.76, 3.45, "amber");
  data.blocks.forEach((block, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    card(slide, block.title, block.items, 0.82 + col * 4.2, 1.95 + row * 2.1, 3.72, 1.78, i % 2 === 0 ? COLORS.blue : COLORS.teal);
  });
}

function hub(slide, data, idx) {
  bg(slide);
  header(slide, data, idx);
  takeaway(slide, data.takeaway, 8.96, 0.76, 3.58, "teal");
  card(slide, "Orchestration hub", ["State", "Control", "Coordination", "Recovery"], 5.0, 2.55, 3.15, 1.42, COLORS.blue);
  const groups = [
    ["Sequences workflow steps", "Manages state transitions"],
    ["Coordinates components", "Acquires and releases work"],
    ["Routes success and failure paths", "Applies retry logic"],
    ["Guarantees cleanup", "Improves observability and governance"]
  ];
  const positions = [
    [0.9, 1.98],
    [9.2, 1.98],
    [0.9, 4.15],
    [9.2, 4.15]
  ];
  groups.forEach((items, i) => {
    card(slide, i < 2 ? "Control domain" : "Outcome domain", items, positions[i][0], positions[i][1], 3.15, 1.45, i % 2 === 0 ? COLORS.blue : COLORS.teal);
  });
}

function transaction(slide, data, idx) {
  bg(slide);
  header(slide, data, idx);
  takeaway(slide, data.takeaway, 8.9, 0.76, 3.65, "teal");
  card(slide, data.leftTitle, data.leftItems, 0.82, 1.95, 5.45, 3.55, COLORS.blue);
  card(slide, data.rightTitle, data.rightItems, 6.95, 1.95, 5.55, 3.1, COLORS.teal);
  slide.addShape(pptx.ShapeType.rightArrow, {
    x: 5.98,
    y: 3.1,
    w: 0.55,
    h: 0.35,
    fill: { color: COLORS.blueSoft },
    line: { color: COLORS.blueSoft, transparency: 100 }
  });
}

function twoPanel(slide, data, idx) {
  bg(slide);
  header(slide, data, idx);
  takeaway(slide, data.takeaway, 8.72, 0.76, 3.82, "crimson");
  data.panels.forEach((panel, i) => {
    const accent = panel.accent === "crimson" ? COLORS.crimson : COLORS.amber;
    const fill = panel.accent === "crimson" ? COLORS.crimsonSoft : COLORS.amberSoft;
    card(slide, panel.title, panel.items, 0.82 + i * 5.95, 1.95, 5.7, 3.7, accent, fill);
  });
}

function process(slide, data, idx) {
  bg(slide);
  header(slide, data, idx);
  takeaway(slide, data.takeaway, 8.92, 0.76, 3.6, "teal");
  card(slide, "Retry model defines", data.bullets, 0.82, 1.95, 4.4, 2.52, COLORS.blue);
  data.steps.forEach((step, i) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 5.52 + i * 1.45,
      y: 2.22 + (i % 2) * 1.15,
      w: 1.22,
      h: 0.85,
      rectRadius: 0.04,
      fill: { color: i % 2 === 0 ? COLORS.white : COLORS.tealSoft },
      line: { color: i % 2 === 0 ? COLORS.blue : COLORS.teal, pt: 1 }
    });
    slide.addText(String(i + 1), {
      x: 5.66 + i * 1.45,
      y: 2.35 + (i % 2) * 1.15,
      w: 0.22,
      h: 0.16,
      fontFace: FONT_BODY,
      fontSize: 8.2,
      bold: true,
      color: COLORS.white,
      align: "center",
      margin: 0
    });
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 5.62 + i * 1.45,
      y: 2.34 + (i % 2) * 1.15,
      w: 0.28,
      h: 0.28,
      fill: { color: i % 2 === 0 ? COLORS.blue : COLORS.teal },
      line: { color: i % 2 === 0 ? COLORS.blue : COLORS.teal, transparency: 100 }
    });
    slide.addText(step, {
      x: 5.96 + i * 1.45,
      y: 2.32 + (i % 2) * 1.15,
      w: 0.6,
      h: 0.4,
      fontFace: FONT_BODY,
      fontSize: 7.6,
      color: COLORS.text,
      margin: 0
    });
  });
}

function architecture(slide, data, idx) {
  bg(slide);
  header(slide, data, idx);
  takeaway(slide, data.takeaway, 8.9, 0.76, 3.62, "amber");
  data.layers.forEach((layer, i) => {
    card(slide, layer.title, layer.items, 0.82 + i * 3.1, 2.1 + (i % 2) * 0.55, 2.7, 2.05, i % 2 === 0 ? COLORS.blue : COLORS.teal);
  });
}

function twoColumnDetail(slide, data, idx) {
  bg(slide);
  header(slide, data, idx);
  takeaway(slide, data.takeaway, 8.92, 0.76, 3.6, "teal");
  card(slide, data.leftTitle, data.leftItems, 0.82, 1.95, 5.45, 3.25, COLORS.blue);
  card(slide, data.rightTitle, data.rightItems, 6.95, 1.95, 5.55, 3.0, COLORS.teal);
}

function apiBasics(slide, data, idx) {
  bg(slide);
  header(slide, data, idx);
  takeaway(slide, data.takeaway, 8.74, 0.76, 3.78, "blue");
  card(slide, "Request elements", data.requestItems, 0.82, 1.95, 4.05, 3.15, COLORS.blue);
  card(slide, "Response elements", data.responseItems, 5.05, 1.95, 3.0, 2.1, COLORS.teal);
  card(slide, "Why BAs should care", data.whyItems, 8.3, 1.95, 4.2, 2.6, COLORS.amber);
}

function closing(slide, data, idx) {
  bg(slide, true);
  header(slide, data, idx, true);
  takeaway(slide, data.takeaway, 0.72, 2.1, 6.0, "teal", true);
  card(slide, "A BA should define", data.defineItems, 0.72, 3.3, 5.95, 3.22, COLORS.blue, COLORS.navy2, COLORS.white, "DCE9FF");
  card(slide, "High-value BA questions", data.questionItems, 7.05, 1.55, 5.48, 4.97, COLORS.teal, COLORS.navy2, COLORS.white, "DCE9FF");
}

function renderSlide(presentation, data, idx) {
  const slide = presentation.addSlide();
  slide.addNotes(data.notes);

  switch (data.layout) {
    case "cover":
      cover(slide, data, idx);
      break;
    case "four-blocks":
      fourBlocks(slide, data, idx);
      break;
    case "hub":
      hub(slide, data, idx);
      break;
    case "transaction":
      transaction(slide, data, idx);
      break;
    case "two-panel":
      twoPanel(slide, data, idx);
      break;
    case "process":
      process(slide, data, idx);
      break;
    case "architecture":
      architecture(slide, data, idx);
      break;
    case "two-column-detail":
      twoColumnDetail(slide, data, idx);
      break;
    case "api-basics":
      apiBasics(slide, data, idx);
      break;
    case "closing":
      closing(slide, data, idx);
      break;
    default:
      throw new Error(`Unknown layout: ${data.layout}`);
  }
}

async function main() {
  await fs.mkdir(exportsDir, { recursive: true });

  const presentation = new pptxgen();
  presentation.layout = "LAYOUT_WIDE";
  presentation.author = "OpenAI Codex";
  presentation.company = "Innobot";
  presentation.subject = "Day 2 - How RPA Works";
  presentation.title = "Day 2 - How RPA Works";
  presentation.lang = "en-US";
  presentation.theme = {
    headFontFace: FONT_HEAD,
    bodyFontFace: FONT_BODY,
    lang: "en-US"
  };

  slides.forEach((slide, idx) => renderSlide(presentation, slide, idx + 1));
  await presentation.writeFile({ fileName: pptxPath });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
