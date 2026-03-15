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
    prompt: "Invoice posting duplicates after retry in Orchestrator. Stabilize safely.",
    subtasks: [
      {
        id: "first_action",
        type: "single_select",
        label: "Best first action",
        points: 2,
        expected: "pause_and_trace",
        options: [
          { id: "pause_and_trace", label: "Pause queue and trace duplicate transaction id" },
          { id: "raise_retry_limit", label: "Increase retries globally" },
          { id: "manual_recovery_only", label: "Move all items to manual processing" }
        ]
      },
      {
        id: "failure_mapping",
        type: "matching",
        label: "Map failure to safest control",
        points: 4,
        leftItems: [
          "Selector fails after UI patch",
          "API returns 429",
          "Timeout then duplicate post"
        ],
        rightOptions: [
          { id: "selector_hardening", label: "Use stable selector/anchor strategy" },
          { id: "backoff_policy", label: "Use bounded retry with exponential backoff" },
          { id: "idempotency_key", label: "Enforce transaction idempotency key check" }
        ],
        expected: {
          "Selector fails after UI patch": "selector_hardening",
          "API returns 429": "backoff_policy",
          "Timeout then duplicate post": "idempotency_key"
        }
      },
      {
        id: "stack_control",
        type: "single_select",
        label: "Best UiPath execution control",
        points: 2,
        expected: "reframework_txn_guard",
        options: [
          { id: "reframework_txn_guard", label: "REFramework retry with transaction guard key" },
          { id: "fixed_delay", label: "Add fixed delay before every transaction" },
          { id: "disable_retry", label: "Disable retries to avoid duplicates" }
        ]
      },
      {
        id: "release_gate",
        type: "single_select",
        label: "Required gate before resuming prod",
        points: 2,
        expected: "canary_with_rollback",
        options: [
          { id: "canary_with_rollback", label: "Canary run with rollback plan and metric watch" },
          { id: "resume_full_load", label: "Resume all queues immediately" },
          { id: "skip_post_incident", label: "Skip incident review and continue" }
        ]
      }
    ]
  },
  AutomationAnywhere: {
    title: "Automation Anywhere Incident Drill",
    prompt: "Credential rotation + timeout spikes are breaking report bots. Stabilize safely.",
    subtasks: [
      {
        id: "first_action",
        type: "single_select",
        label: "Best first action",
        points: 2,
        expected: "contain_and_rotate",
        options: [
          { id: "contain_and_rotate", label: "Contain runs, rotate secret, move to Credential Vault" },
          { id: "hardcode_secret", label: "Hardcode a temporary credential" },
          { id: "ignore_timeout", label: "Ignore timeout alerts for now" }
        ]
      },
      {
        id: "failure_mapping",
        type: "matching",
        label: "Map failure to safest control",
        points: 4,
        leftItems: [
          "Credential exposed in file",
          "One report fails by network timeout",
          "Runner drift between environments"
        ],
        rightOptions: [
          { id: "vault_rotation", label: "Rotate secret and enforce Credential Vault usage" },
          { id: "bounded_item_retry", label: "Retry failed item with cap and continue queue" },
          { id: "env_config", label: "Use environment-scoped config/device variables" }
        ],
        expected: {
          "Credential exposed in file": "vault_rotation",
          "One report fails by network timeout": "bounded_item_retry",
          "Runner drift between environments": "env_config"
        }
      },
      {
        id: "stack_control",
        type: "single_select",
        label: "Best AA execution control",
        points: 2,
        expected: "checkpoint_and_resume",
        options: [
          { id: "checkpoint_and_resume", label: "Checkpoint progress and resume per work item" },
          { id: "restart_full_batch", label: "Restart full batch on single failure" },
          { id: "remove_logging", label: "Reduce logs to improve speed" }
        ]
      },
      {
        id: "release_gate",
        type: "single_select",
        label: "Required gate before resuming prod",
        points: 2,
        expected: "pilot_window",
        options: [
          { id: "pilot_window", label: "Pilot window with alert threshold and rollback trigger" },
          { id: "full_scale_immediately", label: "Scale all runners immediately" },
          { id: "defer_validation", label: "Resume now, validate later" }
        ]
      }
    ]
  },
  Python: {
    title: "Python Automation Incident Drill",
    prompt: "Batch API posting is flaky and occasionally double-posts on retry.",
    subtasks: [
      {
        id: "first_action",
        type: "single_select",
        label: "Best first action",
        points: 2,
        expected: "stop_and_reconcile",
        options: [
          { id: "stop_and_reconcile", label: "Pause job and reconcile duplicate transaction ids" },
          { id: "increase_threads", label: "Increase thread count to clear backlog" },
          { id: "disable_exceptions", label: "Suppress exceptions and continue" }
        ]
      },
      {
        id: "failure_mapping",
        type: "matching",
        label: "Map failure to safest control",
        points: 4,
        leftItems: [
          "HTTP 429 throttling",
          "Partial file read during handoff",
          "Retry causes duplicate API side effect"
        ],
        rightOptions: [
          { id: "backoff_jitter", label: "Bounded backoff with jitter and max attempts" },
          { id: "atomic_handoff", label: "Atomic temp-write then rename ready file" },
          { id: "idempotency_header", label: "Idempotency key/header with dedupe check" }
        ],
        expected: {
          "HTTP 429 throttling": "backoff_jitter",
          "Partial file read during handoff": "atomic_handoff",
          "Retry causes duplicate API side effect": "idempotency_header"
        }
      },
      {
        id: "stack_control",
        type: "single_select",
        label: "Best Python execution control",
        points: 2,
        expected: "structured_retry_wrapper",
        options: [
          { id: "structured_retry_wrapper", label: "Structured retry wrapper + correlation id logging" },
          { id: "sleep_only", label: "Use fixed sleep before each API call" },
          { id: "retry_forever", label: "Retry forever without upper bound" }
        ]
      },
      {
        id: "release_gate",
        type: "single_select",
        label: "Required gate before resuming prod",
        points: 2,
        expected: "canary_and_slo_watch",
        options: [
          { id: "canary_and_slo_watch", label: "Canary batch with SLO/error budget watch" },
          { id: "resume_all_partitions", label: "Resume all partitions immediately" },
          { id: "disable_alerts", label: "Disable alerts during catch-up" }
        ]
      }
    ]
  },
  PowerAutomate: {
    title: "Power Automate Incident Drill",
    prompt: "Flow retries are creating duplicate approvals during connector throttling.",
    subtasks: [
      {
        id: "first_action",
        type: "single_select",
        label: "Best first action",
        points: 2,
        expected: "pause_and_trace",
        options: [
          { id: "pause_and_trace", label: "Pause trigger and trace duplicate correlation ids" },
          { id: "increase_parallelism", label: "Increase parallelism to clear queue" },
          { id: "remove_retry", label: "Remove retry policy completely" }
        ]
      },
      {
        id: "failure_mapping",
        type: "matching",
        label: "Map failure to safest control",
        points: 4,
        leftItems: [
          "Connector returns 429",
          "Approval email sent twice on retry",
          "Shared gateway drift across envs"
        ],
        rightOptions: [
          { id: "bounded_backoff", label: "Bounded exponential backoff policy" },
          { id: "idempotent_guard", label: "Status/idempotency guard before send action" },
          { id: "owned_gateway", label: "Owned gateway config with controlled change" }
        ],
        expected: {
          "Connector returns 429": "bounded_backoff",
          "Approval email sent twice on retry": "idempotent_guard",
          "Shared gateway drift across envs": "owned_gateway"
        }
      },
      {
        id: "stack_control",
        type: "single_select",
        label: "Best Power Automate execution control",
        points: 2,
        expected: "child_flow_guarded",
        options: [
          { id: "child_flow_guarded", label: "Child flow with guarded retries and concurrency cap" },
          { id: "manual_retrigger", label: "Manual retrigger by operators only" },
          { id: "disable_tracking", label: "Disable run tracking to reduce noise" }
        ]
      },
      {
        id: "release_gate",
        type: "single_select",
        label: "Required gate before resuming prod",
        points: 2,
        expected: "pilot_then_promote",
        options: [
          { id: "pilot_then_promote", label: "Pilot scope, validate metrics, then promote" },
          { id: "global_enable", label: "Enable globally in one step" },
          { id: "skip_postmortem", label: "Skip postmortem to save time" }
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
