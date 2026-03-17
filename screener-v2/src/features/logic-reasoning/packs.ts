import type { PromptBlock, RoleId, StackId } from "@/lib/assessment-engine/types";

export interface LogicReasoningOption {
  id: string;
  label: string;
}

export interface LogicReasoningSingleSelectSubtask {
  id: string;
  type: "single_select";
  label: string;
  promptBlocks?: PromptBlock[];
  points: number;
  expected: string;
  options: LogicReasoningOption[];
}

export interface LogicReasoningMatchingSubtask {
  id: string;
  type: "matching";
  label: string;
  promptBlocks?: PromptBlock[];
  points: number;
  expected: Record<string, string>;
  leftItems: string[];
  rightOptions: LogicReasoningOption[];
}

export type LogicReasoningSubtask = LogicReasoningSingleSelectSubtask | LogicReasoningMatchingSubtask;

export interface LogicReasoningPack {
  id: string;
  roleGroup: "core" | "senior_lead";
  stack: StackId;
  title: string;
  prompt: string;
  subtasks: LogicReasoningSubtask[];
}

function singleSelectTask(args: {
  id: string;
  label: string;
  promptBlocks: PromptBlock[];
  expected: string;
  options: LogicReasoningOption[];
}): LogicReasoningSingleSelectSubtask {
  return {
    id: args.id,
    type: "single_select",
    label: args.label,
    promptBlocks: args.promptBlocks,
    points: 1,
    expected: args.expected,
    options: args.options
  };
}

const sharedSubtasks: LogicReasoningSubtask[] = [
  singleSelectTask({
    id: "logic_q1_incident_priority",
    label: "1. Incident Priority",
    promptBlocks: [
      { type: "paragraph", text: "A team fixes system problems using these rules:" },
      {
        type: "list",
        items: [
          "Problems affecting all customers are fixed before problems affecting one customer.",
          "Security problems are fixed before non-security problems at the same level.",
          "Blocked problems cannot be worked on.",
          "If more than one valid problem remains, fix the oldest one first."
        ]
      },
      {
        type: "table",
        heading: "Problems",
        headers: ["Problem", "Impact", "Type", "Status", "Age"],
        rows: [
          ["A", "All customers", "Security", "Open", "4"],
          ["B", "All customers", "Security", "Open", "9"],
          ["C", "All customers", "Non-security", "Open", "12"],
          ["D", "One customer", "Security", "Open", "15"],
          ["E", "All customers", "Security", "Blocked", "20"]
        ]
      },
      { type: "prompt", text: "Which problem should be fixed first?" }
    ],
    expected: "b",
    options: [
      { id: "a", label: "A. A" },
      { id: "b", label: "B. B" },
      { id: "c", label: "C. C" },
      { id: "d", label: "D. D" }
    ]
  }),
  singleSelectTask({
    id: "logic_q2_request_processing_rules",
    label: "2. Request Processing Rules",
    promptBlocks: [
      { type: "paragraph", text: "A system processes requests using these rules in order:" },
      {
        type: "list",
        items: [
          "If Compliance Hold = Yes \u2192 HOLD the request",
          "Else if Required information missing \u2192 RETURN FOR INFO",
          "Else if Fraud Flag = Yes \u2192 REJECT",
          "Else if Duplicate request \u2192 SKIP",
          "Otherwise \u2192 APPROVE"
        ]
      },
      {
        type: "list",
        heading: "Request R",
        items: [
          "Compliance Hold = No",
          "Required information missing = Yes",
          "Fraud Flag = Yes",
          "Duplicate request = Yes"
        ]
      },
      { type: "prompt", text: "What happens to Request R?" }
    ],
    expected: "c",
    options: [
      { id: "a", label: "A. Reject" },
      { id: "b", label: "B. Skip" },
      { id: "c", label: "C. Return for info" },
      { id: "d", label: "D. Approve" }
    ]
  }),
  singleSelectTask({
    id: "logic_q3_deployment_steps",
    label: "3. Deployment Steps",
    promptBlocks: [
      { type: "paragraph", text: "A software update must follow these rules:" },
      {
        type: "list",
        items: [
          "Code review happens before testing",
          "Testing finishes before deployment",
          "Security scan happens after testing but before deployment",
          "Backup must exist before deployment",
          "Monitoring starts right after deployment"
        ]
      },
      { type: "prompt", text: "Which order is correct?" }
    ],
    expected: "b",
    options: [
      { id: "a", label: "A. Code Review \u2192 Testing \u2192 Security Scan \u2192 Backup \u2192 Deployment \u2192 Monitoring" },
      { id: "b", label: "B. Backup \u2192 Code Review \u2192 Testing \u2192 Security Scan \u2192 Deployment \u2192 Monitoring" },
      { id: "c", label: "C. Code Review \u2192 Testing \u2192 Backup \u2192 Deployment \u2192 Security Scan \u2192 Monitoring" },
      { id: "d", label: "D. Code Review \u2192 Security Scan \u2192 Testing \u2192 Backup \u2192 Deployment \u2192 Monitoring" }
    ]
  }),
  singleSelectTask({
    id: "logic_q4_processing_speed",
    label: "4. Processing Speed",
    promptBlocks: [
      { type: "paragraph", text: "A system processes 180 tasks per hour." },
      {
        type: "list",
        heading: "A new update causes",
        items: ["10 minutes downtime, then", "processing becomes 20% faster"]
      },
      {
        type: "list",
        style: "plain",
        items: [
          "A queue must be escalated if total processing time is more than 2 hours.",
          "There are 420 tasks waiting."
        ]
      },
      { type: "prompt", text: "What should the team do?" }
    ],
    expected: "a",
    options: [
      { id: "a", label: "A. Continue normally" },
      { id: "b", label: "B. Escalate immediately" },
      { id: "c", label: "C. Wait and monitor" },
      { id: "d", label: "D. Cannot determine" }
    ]
  }),
  singleSelectTask({
    id: "logic_q5_approval_rules",
    label: "5. Approval Rules",
    promptBlocks: [
      {
        type: "list",
        heading: "Rules",
        items: [
          "Requests above $10,000 need manager approval",
          "Requests with missing documents are flagged first",
          "Duplicate requests are rejected",
          "Flagged requests cannot be approved until documents are added"
        ]
      },
      {
        type: "list",
        heading: "Request X",
        items: [
          "Amount = $15,000",
          "Manager approval = Yes",
          "Documents missing = Yes",
          "Duplicate = No"
        ]
      },
      { type: "prompt", text: "Which statement is true?" }
    ],
    expected: "c",
    options: [
      { id: "a", label: "A. The request will eventually be approved" },
      { id: "b", label: "B. The request will be rejected" },
      { id: "c", label: "C. The request cannot be approved yet" },
      { id: "d", label: "D. Another manager approval is needed" }
    ]
  }),
  singleSelectTask({
    id: "logic_q6_case_status_check",
    label: "6. Case Status Check",
    promptBlocks: [
      {
        type: "list",
        heading: "Rules",
        items: [
          "A case must go to Review before Approval",
          "Once Released, it cannot go back to Review",
          "If Cancelled, nothing can happen after that"
        ]
      },
      {
        type: "list",
        heading: "Case logs",
        items: [
          "Case A: New \u2192 Review \u2192 Approved \u2192 Released",
          "Case B: New \u2192 Review \u2192 Approved \u2192 Released \u2192 Review",
          "Case C: New \u2192 Approved \u2192 Review \u2192 Released",
          "Case D: New \u2192 Review \u2192 Cancelled \u2192 Released",
          "Case E: New \u2192 Review \u2192 Approved \u2192 Released \u2192 Closed"
        ]
      },
      { type: "prompt", text: "Which case follows all the rules?" }
    ],
    expected: "a",
    options: [
      { id: "a", label: "A. Case A" },
      { id: "b", label: "B. Case B" },
      { id: "c", label: "C. Case D" },
      { id: "d", label: "D. Case E" }
    ]
  }),
  singleSelectTask({
    id: "logic_q7_logical_reasoning",
    label: "7. Logical Reasoning",
    promptBlocks: [
      {
        type: "list",
        heading: "Statements",
        items: [
          "If a task is automated, it must have a script.",
          "If a task has a script, it must pass testing.",
          "Some tasks that pass testing are not automated.",
          "Task T passed testing."
        ]
      },
      { type: "prompt", text: "What must be true?" }
    ],
    expected: "c",
    options: [
      { id: "a", label: "A. Task T is automated" },
      { id: "b", label: "B. Task T has a script" },
      { id: "c", label: "C. Task T may or may not be automated" },
      { id: "d", label: "D. Task T failed testing" }
    ]
  }),
  singleSelectTask({
    id: "logic_q8_task_assignment",
    label: "8. Task Assignment",
    promptBlocks: [
      { type: "paragraph", text: "Four tasks must be assigned: A, B, C, D" },
      {
        type: "list",
        heading: "Rules",
        items: [
          "Task A needs SQL knowledge",
          "Task B needs Python knowledge",
          "Task C needs both SQL and Python",
          "Task D needs no special skills"
        ]
      },
      {
        type: "list",
        heading: "Team members",
        items: [
          "Alex: knows SQL only",
          "Ben: knows Python only",
          "Cara: knows SQL and Python",
          "Dana: knows neither"
        ]
      },
      {
        type: "list",
        heading: "Extra rules",
        items: [
          "Cara cannot take Task C if Alex takes Task A",
          "Dana must take Task D if Ben takes Task B",
          "Each person can take only one task"
        ]
      },
      { type: "prompt", text: "Which assignment works?" }
    ],
    expected: "d",
    options: [
      { id: "a", label: "A. Alex \u2192 A, Ben \u2192 B, Cara \u2192 C, Dana \u2192 D" },
      { id: "b", label: "B. Alex \u2192 A, Ben \u2192 C, Cara \u2192 B, Dana \u2192 D" },
      { id: "c", label: "C. Alex \u2192 D, Ben \u2192 B, Cara \u2192 C, Dana \u2192 A" },
      { id: "d", label: "D. Alex \u2192 A, Ben \u2192 D, Cara \u2192 C, Dana \u2192 B" }
    ]
  }),
  singleSelectTask({
    id: "logic_q9_system_alert",
    label: "9. System Alert",
    promptBlocks: [
      {
        type: "list",
        heading: "System rules",
        items: [
          "If a system failure happens, an alert is always created.",
          "If an alert is created, it appears in the dashboard.",
          "Sometimes alerts appear during system tests, even when there is no failure."
        ]
      },
      {
        type: "list",
        heading: "Observation",
        items: ["An alert appeared in the dashboard."]
      },
      { type: "prompt", text: "What can we conclude?" }
    ],
    expected: "d",
    options: [
      { id: "a", label: "A. A system failure happened" },
      { id: "b", label: "B. A system test happened" },
      { id: "c", label: "C. Either failure or test happened" },
      { id: "d", label: "D. We cannot know if a failure happened" }
    ]
  }),
  singleSelectTask({
    id: "logic_q10_guaranteed_approval",
    label: "10. Guaranteed Approval",
    promptBlocks: [
      {
        type: "list",
        heading: "Transaction rules",
        items: [
          "If Maintenance Window = Yes \u2192 HOLD",
          "Else if Risk Score > 30 \u2192 REJECT",
          "Else if Amount > $5000 \u2192 MANUAL REVIEW",
          "Otherwise \u2192 Auto-approve only if documents are complete OR vendor is trusted"
        ]
      },
      { type: "prompt", text: "Which condition guarantees automatic approval?" }
    ],
    expected: "d",
    options: [
      { id: "a", label: "A. Risk \u2264 30 and Amount \u2264 $5000" },
      { id: "b", label: "B. Trusted vendor = Yes" },
      { id: "c", label: "C. Risk \u2264 30, Amount \u2264 $5000, Trusted vendor = Yes" },
      { id: "d", label: "D. Maintenance window = No, Risk \u2264 30, Amount \u2264 $5000, Trusted vendor = Yes" }
    ]
  })
];

const sharedPack = {
  title: "Applied Logic & Reasoning",
  prompt: "Answer each logical thinking question. Select one answer for each item.",
  subtasks: sharedSubtasks
};

export function pickLogicReasoningPack(roleId: RoleId, stacks: StackId[]): LogicReasoningPack {
  const primaryStack = stacks[0] || "UiPath";

  return {
    id: `logic_reasoning_${primaryStack}_${roleId}`,
    roleGroup: ["Intern", "Associate", "SE"].includes(roleId) ? "core" : "senior_lead",
    stack: primaryStack,
    title: sharedPack.title,
    prompt: sharedPack.prompt,
    subtasks: sharedPack.subtasks
  };
}
