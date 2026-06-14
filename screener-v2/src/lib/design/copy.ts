export const copy = {
  nav: {
    addons: "Add-ons",
    create: "Assessments",
    candidates: "Candidates",
    jobs: "Careers",
    run: "Live sessions",
    results: "Results",
    users: "Users"
  },

  /** ATS domain vocabulary — canonical terms per the enterprise ATS convention.
   * All user-facing labels for these concepts must source from here. */
  ats: {
    // People
    applicant: "Applicant",
    applicants: "Applicants",
    candidate: "Candidate",
    candidates: "Candidates",
    prospect: "Prospect",
    talentPool: "Talent Pool",
    hiringTeam: "Hiring Team",
    approver: "Approver",
    approvers: "Approvers",
    hrOwner: "HR Owner",
    recruiter: "Recruiter",

    // Job
    job: "Job",
    jobs: "Jobs",
    requisition: "Requisition",
    jobPosting: "Job Posting",
    openRole: "Open Role",
    department: "Department",

    // Pipeline
    stage: "Stage",
    pipeline: "Pipeline",
    application: "Application",
    applications: "Applications",

    // Evaluation
    scorecard: "Scorecard",
    scorecards: "Scorecards",
    interviewKit: "Interview Kit",
    interviewKits: "Interview Kits",
    assessment: "Assessment",
    assessments: "Assessments",

    // Source
    source: "Source",
    sources: "Sources",

    // Offer
    offer: "Offer",
    offers: "Offers",

    // Actions
    advance: "Advance",
    reject: "Reject",
    hire: "Hire",
    scheduleInterview: "Schedule interview",
    sendOffer: "Send offer",
    requestApproval: "Request approval",

    // States
    active: "Active",
    finalized: "Finalized",
    hired: "Hired",
    rejected: "Rejected",
    pending: "Pending",
    approved: "Approved",
    declined: "Declined",
    waitingOn: "Waiting on",
    blockedBy: "Blocked by",
    approvedBy: "Approved by",
    pendingItems: "Pending items",
    needsAttention: "Needs attention",
    currentState: "Current state",

    // Empty states
    noApplicants: "No applicants",
    noCandidates: "No candidates",
    noJobs: "No open jobs",
    noScorecard: "No scorecard submitted",
    noOffer: "No offer on file",
    noHiringTeam: "No hiring team assigned",
    addOrImport: "Add or import candidates",

    // Milestone labels
    milestones: {
      applicationReceived: "Application received",
      screeningCall: "Screening call",
      technicalAssessment: "Technical assessment",
      interview: "Interview",
      advancedReview: "Advanced review",
      offerExtended: "Offer extended",
      hired: "Hired",
    },
  },
  landing: {
    headline: "Manage jobs, applicants, assessments, and hiring decisions in one place.",
    subtext: "Northstar helps hiring teams keep candidate work, review context, and final decisions connected.",
    primaryCta: "Create assessment",
    secondaryCta: "Start assessment"
  },
  create: {
    eyebrow: "Create assessment",
    title: "Set up your assessment",
    subtitle: "Choose the role, skills, and sharing details.",
    role: "Role",
    stack: "Skills",
    advanced: "More options",
    summary: "Summary",
    share: "Share assessment",
    generate: "Create link",
    startNow: "Start now",
    ready: "Ready to share",
    testLink: "Assessment link",
    testId: "Assessment ID",
    passcode: "Access code",
    copyLink: "Copy link",
    copyDetails: "Copy details",
    startTest: "Begin assessment"
  },
  run: {
    eyebrow: "Start assessment",
    title: "Begin",
    subtitle: "This assessment takes around 30 minutes. Your answers are saved automatically."
  },
  runModes: {
    link: "Use a link",
    testId: "Use an assessment ID",
    live: "Join a live session",
    employee: "Internal access",
    selectedMethod: "Selected method",
    nextStep: "What's next",
    testFlow: "What to expect",
    start: "Continue"
  },
  runtime: {
    core: "Core section",
    practical: "Practical section",
    navigator: "Questions",
    back: "Back",
    timeLeft: "Time left",
    startPractical: "Start practical",
    reviewSubmit: "Review and submit",
    submitTitle: "Submit assessment?",
    submittedTitle: "Submission confirmed",
    submittedBody: "Your assessment has been submitted successfully. You can now close this page or return home.",
    finish: "Finish"
  },
  results: {
    eyebrow: "Results",
    title: "Results",
    subtitle: "Review completed assessments and results.",
    finalScore: "Final score",
    outcome: "Result",
    topStrength: "Strongest area",
    mainRisk: "Main concern",
    confidence: "Confidence",
    categoryBreakdown: "Score breakdown",
    watchout: "Concerns"
  }
} as const;
