export type RouteId =
  | "marketing_home"
  | "studio_home"
  | "studio_assessments"
  | "studio_assessment_new"
  | "studio_assessment_edit"
  | "studio_assessment_publish"
  | "studio_results"
  | "studio_result_detail"
  | "invite_landing"
  | "invite_start"
  | "invite_runtime"
  | "invite_result"
  | "employee_entry"
  | "employee_verify"
  | "live_control"
  | "live_entry";

export type CtaIntent = "open" | "create" | "launch" | "start" | "view" | "export" | "copy";
export type CtaPriority = "primary" | "secondary" | "ghost";

export interface CtaSpec {
  label: string;
  intent: CtaIntent;
  priority: CtaPriority;
  hotkey?: string;
}

export interface MotionPreset {
  enter: "soft" | "cinematic" | "snappy";
  exit: "soft" | "cinematic" | "snappy";
  micro: "subtle" | "assertive";
  reduceMotionFallback: "none" | "fade";
}

export interface RouteUxSpec {
  routeId: RouteId;
  pageName: string;
  pagePurpose: string;
  maxHelperBullets: number;
  maxSubcopySentences: number;
  ctas: CtaSpec[];
  motion: MotionPreset;
}

export const routeUxSpecMap: Record<RouteId, RouteUxSpec> = {
  marketing_home: {
    routeId: "marketing_home",
    pageName: "Hiring Signal in 30",
    pagePurpose: "Confidence and quick launch into Studio or Live Session.",
    maxHelperBullets: 3,
    maxSubcopySentences: 1,
    ctas: [
      { label: "Open Studio", intent: "open", priority: "primary" },
      { label: "Start Live Session", intent: "launch", priority: "secondary" }
    ],
    motion: { enter: "cinematic", exit: "soft", micro: "subtle", reduceMotionFallback: "fade" }
  },
  studio_home: {
    routeId: "studio_home",
    pageName: "Studio Command",
    pagePurpose: "Fast task-first entry into Assessments, Launch, and Results.",
    maxHelperBullets: 0,
    maxSubcopySentences: 1,
    ctas: [
      { label: "Open Assessments", intent: "open", priority: "primary" },
      { label: "Launch Live", intent: "launch", priority: "secondary" },
      { label: "Results", intent: "view", priority: "secondary" }
    ],
    motion: { enter: "soft", exit: "soft", micro: "subtle", reduceMotionFallback: "fade" }
  },
  studio_assessments: {
    routeId: "studio_assessments",
    pageName: "Assessment Library",
    pagePurpose: "Manage templates and open builders quickly.",
    maxHelperBullets: 0,
    maxSubcopySentences: 1,
    ctas: [
      { label: "Create Assessment", intent: "create", priority: "primary" },
      { label: "Open Builder", intent: "open", priority: "secondary" }
    ],
    motion: { enter: "soft", exit: "soft", micro: "subtle", reduceMotionFallback: "fade" }
  },
  studio_assessment_new: {
    routeId: "studio_assessment_new",
    pageName: "Create Assessment",
    pagePurpose: "Preset-first build in one pass.",
    maxHelperBullets: 3,
    maxSubcopySentences: 1,
    ctas: [
      { label: "Generate Invite", intent: "create", priority: "primary" },
      { label: "Open Full Blueprint", intent: "open", priority: "secondary" }
    ],
    motion: { enter: "soft", exit: "soft", micro: "subtle", reduceMotionFallback: "fade" }
  },
  studio_assessment_edit: {
    routeId: "studio_assessment_edit",
    pageName: "Blueprint Tuning",
    pagePurpose: "Tune pass target, format balance, and practical gate.",
    maxHelperBullets: 0,
    maxSubcopySentences: 1,
    ctas: [
      { label: "Save Draft", intent: "create", priority: "primary" },
      { label: "Preview Runtime", intent: "view", priority: "secondary" },
      { label: "Publish", intent: "open", priority: "secondary" }
    ],
    motion: { enter: "soft", exit: "soft", micro: "assertive", reduceMotionFallback: "fade" }
  },
  studio_assessment_publish: {
    routeId: "studio_assessment_publish",
    pageName: "Launch Access",
    pagePurpose: "Generate and share invite credentials.",
    maxHelperBullets: 0,
    maxSubcopySentences: 1,
    ctas: [
      { label: "Generate Invite", intent: "create", priority: "primary" },
      { label: "Copy URL", intent: "copy", priority: "secondary" },
      { label: "Start test", intent: "open", priority: "secondary" }
    ],
    motion: { enter: "snappy", exit: "soft", micro: "assertive", reduceMotionFallback: "fade" }
  },
  studio_results: {
    routeId: "studio_results",
    pageName: "Decision Queue",
    pagePurpose: "Triage pass, review, and fail outcomes.",
    maxHelperBullets: 0,
    maxSubcopySentences: 1,
    ctas: [
      { label: "Open result", intent: "view", priority: "primary" },
      { label: "Export CSV", intent: "export", priority: "secondary" },
      { label: "Export JSON", intent: "export", priority: "secondary" }
    ],
    motion: { enter: "soft", exit: "soft", micro: "subtle", reduceMotionFallback: "fade" }
  },
  studio_result_detail: {
    routeId: "studio_result_detail",
    pageName: "Results",
    pagePurpose: "Make a final decision with clear signals.",
    maxHelperBullets: 0,
    maxSubcopySentences: 1,
    ctas: [
      { label: "Back to Queue", intent: "view", priority: "secondary" },
      { label: "Export CSV", intent: "export", priority: "secondary" }
    ],
    motion: { enter: "cinematic", exit: "soft", micro: "assertive", reduceMotionFallback: "fade" }
  },
  invite_landing: {
    routeId: "invite_landing",
    pageName: "Assessment Briefing",
    pagePurpose: "Calm entry and clean transition to check-in.",
    maxHelperBullets: 2,
    maxSubcopySentences: 1,
    ctas: [{ label: "Begin check-in", intent: "start", priority: "primary" }],
    motion: { enter: "cinematic", exit: "soft", micro: "subtle", reduceMotionFallback: "fade" }
  },
  invite_start: {
    routeId: "invite_start",
    pageName: "Check-in",
    pagePurpose: "Confirm identity and role/stack before start.",
    maxHelperBullets: 3,
    maxSubcopySentences: 1,
    ctas: [{ label: "Start test", intent: "start", priority: "primary" }],
    motion: { enter: "soft", exit: "soft", micro: "subtle", reduceMotionFallback: "fade" }
  },
  invite_runtime: {
    routeId: "invite_runtime",
    pageName: "Runtime",
    pagePurpose: "Immersive answering flow with clear progress.",
    maxHelperBullets: 0,
    maxSubcopySentences: 0,
    ctas: [
      { label: "Back", intent: "view", priority: "ghost", hotkey: "Shift+Tab" },
      { label: "Next", intent: "view", priority: "primary", hotkey: "Tab" }
    ],
    motion: { enter: "cinematic", exit: "soft", micro: "assertive", reduceMotionFallback: "fade" }
  },
  invite_result: {
    routeId: "invite_result",
    pageName: "Results",
    pagePurpose: "Concise closure with score, outcome, and key signals.",
    maxHelperBullets: 0,
    maxSubcopySentences: 1,
    ctas: [{ label: "Finish", intent: "view", priority: "primary" }],
    motion: { enter: "cinematic", exit: "soft", micro: "subtle", reduceMotionFallback: "fade" }
  },
  employee_entry: {
    routeId: "employee_entry",
    pageName: "Employee Access",
    pagePurpose: "Internal entry using magic link.",
    maxHelperBullets: 0,
    maxSubcopySentences: 1,
    ctas: [{ label: "Send Magic Link", intent: "start", priority: "primary" }],
    motion: { enter: "soft", exit: "soft", micro: "subtle", reduceMotionFallback: "fade" }
  },
  employee_verify: {
    routeId: "employee_verify",
    pageName: "Verify and Continue",
    pagePurpose: "Token verification and assessment start.",
    maxHelperBullets: 0,
    maxSubcopySentences: 1,
    ctas: [{ label: "Verify and Continue", intent: "start", priority: "primary" }],
    motion: { enter: "soft", exit: "soft", micro: "subtle", reduceMotionFallback: "fade" }
  },
  live_control: {
    routeId: "live_control",
    pageName: "Live Session Control",
    pagePurpose: "Host launch cockpit during interviews.",
    maxHelperBullets: 3,
    maxSubcopySentences: 1,
    ctas: [
      { label: "Generate link", intent: "create", priority: "primary" },
      { label: "Open Candidate Runtime", intent: "open", priority: "secondary" }
    ],
    motion: { enter: "snappy", exit: "soft", micro: "assertive", reduceMotionFallback: "fade" }
  },
  live_entry: {
    routeId: "live_entry",
    pageName: "Live Session Entry",
    pagePurpose: "Fallback route with code and token/passcode continuation.",
    maxHelperBullets: 0,
    maxSubcopySentences: 1,
    ctas: [{ label: "Continue to Check-in", intent: "start", priority: "primary" }],
    motion: { enter: "soft", exit: "soft", micro: "subtle", reduceMotionFallback: "fade" }
  }
};
