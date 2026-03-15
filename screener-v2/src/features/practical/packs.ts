import type { RoleId, StackId } from "@/lib/assessment-engine/types";

export interface PracticalOption {
  id: string;
  label: string;
}

export interface PracticalSingleSelectSubtask {
  id: string;
  type: "single_select";
  label: string;
  points: number;
  expected: string;
  options: PracticalOption[];
}

export interface PracticalMatchingSubtask {
  id: string;
  type: "matching";
  label: string;
  points: number;
  expected: Record<string, string>;
  leftItems: string[];
  rightOptions: PracticalOption[];
}

export type PracticalSubtask = PracticalSingleSelectSubtask | PracticalMatchingSubtask;

export interface PracticalPack {
  id: string;
  roleGroup: "core" | "senior_lead";
  stack: StackId;
  title: string;
  prompt: string;
  subtasks: PracticalSubtask[];
}

const stackScenarios: Record<StackId, { title: string; prompt: string; subtasks: PracticalSubtask[] }> = {
  UiPath: {
    title: "UiPath Incident Drill",
    prompt: "A UiPath bot posts invoices into an ERP. After a short ERP issue, retries caused some invoices to be posted twice.",
    subtasks: [
      {
        id: "first_action",
        type: "single_select",
        label: "Best first action",
        points: 2,
        expected: "pause_and_find",
        options: [
          { id: "pause_and_find", label: "Pause the queue, find the affected transaction references, and stop more duplicates" },
          { id: "increase_retry", label: "Increase retry settings in Orchestrator so the backlog clears faster" },
          { id: "continue_and_fix", label: "Let the bot continue and fix duplicate invoices later" }
        ]
      },
      {
        id: "failure_mapping",
        type: "matching",
        label: "Map failure to safest control",
        points: 4,
        leftItems: [
          "Selector breaks after an ERP screen update",
          "The bot times out after clicking Save, but the invoice may already be posted",
          "The same invoice gets processed twice after a retry"
        ],
        rightOptions: [
          { id: "stable_selector", label: "Fix the selector using stable attributes and test before rerun" },
          { id: "check_posted", label: "Check whether the invoice was already posted before retrying" },
          { id: "unique_check", label: "Add a unique invoice check before posting again" }
        ],
        expected: {
          "Selector breaks after an ERP screen update": "stable_selector",
          "The bot times out after clicking Save, but the invoice may already be posted": "check_posted",
          "The same invoice gets processed twice after a retry": "unique_check"
        }
      },
      {
        id: "execution_control",
        type: "single_select",
        label: "Best UiPath execution control",
        points: 2,
        expected: "transaction_processing",
        options: [
          { id: "transaction_processing", label: "Use transaction-based processing with duplicate checks and controlled retries" },
          { id: "try_catch_whole", label: "Put the full queue in one Try Catch and restart the whole job on error" },
          { id: "delay_every", label: "Add a delay after every activity" }
        ]
      },
      {
        id: "required_gate",
        type: "single_select",
        label: "Required gate before resuming prod",
        points: 2,
        expected: "small_test_batch",
        options: [
          { id: "small_test_batch", label: "Run a small test batch, confirm no duplicates, then resume slowly" },
          { id: "resume_full", label: "Resume the full queue once the selector is fixed" },
          { id: "restart_robots", label: "Restart robots on full load immediately" }
        ]
      }
    ]
  },
  AutomationAnywhere: {
    title: "Automation Anywhere Incident Drill",
    prompt: "An Automation Anywhere bot creates daily reports and uploads them to a portal. After a password change and runner issues, some reports fail and some reruns overwrite files.",
    subtasks: [
      {
        id: "first_action",
        type: "single_select",
        label: "Best first action",
        points: 2,
        expected: "stop_verify_isolate",
        options: [
          { id: "stop_verify_isolate", label: "Stop scheduled runs, verify the updated credential, and isolate the affected reports" },
          { id: "hardcode_password", label: "Hardcode the new password so reports can resume quickly" },
          { id: "add_runners", label: "Add more runners before checking the failures" }
        ]
      },
      {
        id: "failure_mapping",
        type: "matching",
        label: "Map failure to safest control",
        points: 4,
        leftItems: [
          "A credential is stored in a file on the runner",
          "One upload fails because the network drops",
          "The bot works on one runner but fails on another"
        ],
        rightOptions: [
          { id: "vault_and_update", label: "Move it to Credential Vault and update the bot to use it" },
          { id: "checkpoint_retry", label: "Retry only the failed report using checkpointed progress" },
          { id: "compare_setup", label: "Compare bot version, config, and runner setup before rerun" }
        ],
        expected: {
          "A credential is stored in a file on the runner": "vault_and_update",
          "One upload fails because the network drops": "checkpoint_retry",
          "The bot works on one runner but fails on another": "compare_setup"
        }
      },
      {
        id: "execution_control",
        type: "single_select",
        label: "Best Automation Anywhere execution control",
        points: 2,
        expected: "checkpoint_tracking",
        options: [
          { id: "checkpoint_tracking", label: "Use checkpoints and track each report so finished work is not rerun" },
          { id: "restart_whole", label: "Restart the whole batch when one report fails" },
          { id: "keep_running", label: "Keep going without tracking completed reports" }
        ]
      },
      {
        id: "required_gate",
        type: "single_select",
        label: "Required gate before resuming prod",
        points: 2,
        expected: "pilot_scale",
        options: [
          { id: "pilot_scale", label: "Run a small pilot, check report accuracy and overwrite rate, then scale up" },
          { id: "return_all", label: "Return it to all runners after one successful run" },
          { id: "resume_and_wait", label: "Resume and wait for operations to report issues" }
        ]
      }
    ]
  },
  Python: {
    title: "Python Automation Incident Drill",
    prompt: "A Python batch job reads records from a file and sends them to an API. During temporary failures, retries sometimes create duplicate submissions, and one input file is sometimes incomplete.",
    subtasks: [
      {
        id: "first_action",
        type: "single_select",
        label: "Best first action",
        points: 2,
        expected: "pause_and_check_duplicates",
        options: [
          { id: "pause_and_check_duplicates", label: "Pause the batch, identify affected record IDs, and check for duplicate submissions before replay" },
          { id: "increase_threads", label: "Increase thread count so backlog finishes faster" },
          { id: "catch_all", label: "Catch all exceptions and let the batch continue" }
        ]
      },
      {
        id: "failure_mapping",
        type: "matching",
        label: "Map failure to safest control",
        points: 4,
        leftItems: [
          "The API starts returning HTTP 429",
          "The batch reads a file before the upstream copy is complete",
          "A POST may already have succeeded before retry"
        ],
        rightOptions: [
          { id: "backoff_and_slowdown", label: "Use bounded retries with backoff and slow down requests" },
          { id: "check_file_complete", label: "Check that the file is complete before processing" },
          { id: "idempotent_key", label: "Use an idempotency key or duplicate check before posting again" }
        ],
        expected: {
          "The API starts returning HTTP 429": "backoff_and_slowdown",
          "The batch reads a file before the upstream copy is complete": "check_file_complete",
          "A POST may already have succeeded before retry": "idempotent_key"
        }
      },
      {
        id: "stack_control",
        type: "single_select",
        label: "Best Python execution control",
        points: 2,
        expected: "per_record_retries",
        options: [
          { id: "per_record_retries", label: "Use per-record retries with backoff, clear tracking, and duplicate-safe posting" },
          { id: "fixed_sleep", label: "Add a fixed sleep before every API call" },
          { id: "restart_all", label: "Restart the whole batch whenever one record fails" }
        ]
      },
      {
        id: "required_gate",
        type: "single_select",
        label: "Required gate before resuming prod",
        points: 2,
        expected: "small_monitored_batch",
        options: [
          { id: "small_monitored_batch", label: "Run a small monitored batch, check duplicates and errors, then scale up" },
          { id: "resume_partitions", label: "Resume all partitions once one record succeeds" },
          { id: "disable_alerts", label: "Turn off alerts during catch-up" }
        ]
      }
    ]
  },
  PowerAutomate: {
    title: "Power Automate Incident Drill",
    prompt: "A Power Automate flow creates approvals from a SharePoint list. During connector throttling, retries and overlapping runs started creating duplicate approvals.",
    subtasks: [
      {
        id: "first_action",
        type: "single_select",
        label: "Best first action",
        points: 2,
        expected: "turn_off_trigger",
        options: [
          { id: "turn_off_trigger", label: "Turn off the trigger, identify duplicate runs, and isolate the affected items" },
          { id: "increase_concurrency", label: "Increase trigger concurrency so pending approvals process faster" },
          { id: "remove_retries", label: "Remove all retries from the flow immediately" }
        ]
      },
      {
        id: "failure_mapping",
        type: "matching",
        label: "Map failure to safest control",
        points: 4,
        leftItems: [
          "A connector starts returning 429 errors",
          "The same approval email is sent twice after retry",
          "The flow behaves differently in Dev and Prod"
        ],
        rightOptions: [
          { id: "bounded_retry", label: "Use bounded retry/backoff and reduce concurrency pressure" },
          { id: "duplicate_check", label: "Add a check so the flow confirms whether an approval already exists before sending again" },
          { id: "env_check", label: "Check connection references, environment variables, and dependencies" }
        ],
        expected: {
          "A connector starts returning 429 errors": "bounded_retry",
          "The same approval email is sent twice after retry": "duplicate_check",
          "The flow behaves differently in Dev and Prod": "env_check"
        }
      },
      {
        id: "stack_control",
        type: "single_select",
        label: "Best Power Automate execution control",
        points: 2,
        expected: "controlled_execution",
        options: [
          { id: "controlled_execution", label: "Use controlled execution with limited concurrency and duplicate-safe checks" },
          { id: "manual_retrigger", label: "Ask operators to manually retrigger failed runs" },
          { id: "disable_history", label: "Disable run history during the incident" }
        ]
      },
      {
        id: "required_gate",
        type: "single_select",
        label: "Required gate before resuming prod",
        points: 2,
        expected: "small_pilot",
        options: [
          { id: "small_pilot", label: "Re-enable on a small pilot, confirm approvals are unique, then expand" },
          { id: "full_restart", label: "Re-enable full flow once one item works" },
          { id: "resume_complaint", label: "Resume and wait for users to report issues" }
        ]
      }
    ]
  }
};

const roleGroups: Record<RoleId, "core" | "senior_lead"> = {
  Intern: "core",
  Associate: "core",
  SE: "core",
  SeniorSE: "senior_lead",
  TechLead: "senior_lead"
};

export function roleGroup(roleId: RoleId): "core" | "senior_lead" {
  return roleGroups[roleId];
}

export const practicalPacks: PracticalPack[] = ([
  "UiPath",
  "AutomationAnywhere",
  "Python",
  "PowerAutomate"
] as StackId[]).flatMap((stack) => [
  {
    id: `core_${stack}`,
    roleGroup: "core",
    stack,
    title: stackScenarios[stack].title,
    prompt: stackScenarios[stack].prompt,
    subtasks: stackScenarios[stack].subtasks
  },
  {
    id: `senior_lead_${stack}`,
    roleGroup: "senior_lead",
    stack,
    title: stackScenarios[stack].title,
    prompt: stackScenarios[stack].prompt,
    subtasks: stackScenarios[stack].subtasks
  }
]);

export function pickPracticalPack(roleId: RoleId, stacks: StackId[]): PracticalPack {
  const group = roleGroup(roleId);
  const primaryStack = stacks[0] || "UiPath";
  return (
    practicalPacks.find((pack) => pack.roleGroup === group && pack.stack === primaryStack) ||
    practicalPacks[0]
  );
}
