import type { RoleId, StackId } from "@/lib/assessment-engine/types";

export interface LogicReasoningOption {
  id: string;
  label: string;
}

export interface LogicReasoningSingleSelectSubtask {
  id: string;
  type: "single_select";
  label: string;
  points: number;
  expected: string;
  options: LogicReasoningOption[];
}

export interface LogicReasoningMatchingSubtask {
  id: string;
  type: "matching";
  label: string;
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

const stackScenarios: Record<StackId, { title: string; prompt: string; subtasks: LogicReasoningSubtask[] }> = {
  UiPath: {
    title: "UiPath Logic & Reasoning Challenge",
    prompt: "Analyze the following automation scenario and answer the logic-based questions.",
    subtasks: [
      {
        id: "logic_1",
        type: "single_select",
        label: "What is the most efficient way to handle this conditional logic?",
        points: 2,
        expected: "use_flow_decision",
        options: [
          { id: "use_flow_decision", label: "Use a Flow Decision activity" },
          { id: "use_if_else", label: "Use If-Else statements in code" },
          { id: "use_switch", label: "Use a Switch activity" },
          { id: "manual_check", label: "Manually check each condition" }
        ]
      },
      {
        id: "logic_2",
        type: "matching",
        label: "Match the UiPath activities to their best use cases",
        points: 3,
        expected: {
          "data_scraping": "extract_data_from_web",
          "excel_automation": "read_write_excel",
          "email_automation": "send_receive_emails",
          "api_integration": "call_rest_services"
        },
        leftItems: ["Data Scraping", "Excel Automation", "Email Automation", "API Integration"],
        rightOptions: [
          { id: "extract_data_from_web", label: "Extract data from web pages" },
          { id: "read_write_excel", label: "Read and write Excel files" },
          { id: "send_receive_emails", label: "Send and receive emails" },
          { id: "call_rest_services", label: "Call REST API services" }
        ]
      }
    ]
  },
  AutomationAnywhere: {
    title: "Automation Anywhere Logic & Reasoning Challenge",
    prompt: "Evaluate the automation logic and solve the reasoning problems.",
    subtasks: [
      {
        id: "logic_1",
        type: "single_select",
        label: "Best approach for handling dynamic web elements?",
        points: 2,
        expected: "use_dynamic_selectors",
        options: [
          { id: "use_dynamic_selectors", label: "Use dynamic selectors with wildcards" },
          { id: "hardcode_paths", label: "Hardcode XPath paths" },
          { id: "use_coordinates", label: "Use screen coordinates" },
          { id: "avoid_automation", label: "Avoid automating dynamic elements" }
        ]
      },
      {
        id: "logic_2",
        type: "matching",
        label: "Match AA commands to their primary functions",
        points: 3,
        expected: {
          "object_cloning": "capture_ui_elements",
          "variable_operations": "manipulate_data",
          "loop_commands": "iterate_collections",
          "error_handling": "manage_exceptions"
        },
        leftItems: ["Object Cloning", "Variable Operations", "Loop Commands", "Error Handling"],
        rightOptions: [
          { id: "capture_ui_elements", label: "Capture UI elements for automation" },
          { id: "manipulate_data", label: "Manipulate data variables" },
          { id: "iterate_collections", label: "Iterate over collections of data" },
          { id: "manage_exceptions", label: "Manage exceptions and errors" }
        ]
      }
    ]
  },
  Python: {
    title: "Python Logic & Reasoning Challenge",
    prompt: "Apply logical reasoning to solve these Python automation problems.",
    subtasks: [
      {
        id: "logic_1",
        type: "single_select",
        label: "Most appropriate data structure for this use case?",
        points: 2,
        expected: "dictionary",
        options: [
          { id: "list", label: "List for ordered collection" },
          { id: "dictionary", label: "Dictionary for key-value mapping" },
          { id: "set", label: "Set for unique elements" },
          { id: "tuple", label: "Tuple for immutable data" }
        ]
      },
      {
        id: "logic_2",
        type: "matching",
        label: "Match Python libraries to their purposes",
        points: 3,
        expected: {
          "pandas": "data_manipulation",
          "selenium": "web_automation",
          "requests": "api_calls",
          "openpyxl": "excel_handling"
        },
        leftItems: ["pandas", "selenium", "requests", "openpyxl"],
        rightOptions: [
          { id: "data_manipulation", label: "Data manipulation and analysis" },
          { id: "web_automation", label: "Web browser automation" },
          { id: "api_calls", label: "HTTP API calls" },
          { id: "excel_handling", label: "Excel file handling" }
        ]
      }
    ]
  },
  PowerAutomate: {
    title: "Power Automate Logic & Reasoning Challenge",
    prompt: "Reason through the flow logic and answer the questions.",
    subtasks: [
      {
        id: "logic_1",
        type: "single_select",
        label: "Best trigger for this automation scenario?",
        points: 2,
        expected: "recurrence",
        options: [
          { id: "manual", label: "Manual trigger" },
          { id: "recurrence", label: "Recurrence trigger" },
          { id: "button", label: "Power Apps button trigger" },
          { id: "email", label: "When email arrives" }
        ]
      },
      {
        id: "logic_2",
        type: "matching",
        label: "Match Power Automate actions to their categories",
        points: 3,
        expected: {
          "compose": "data_operations",
          "condition": "control_flow",
          "apply_to_each": "loops",
          "send_email": "communication"
        },
        leftItems: ["Compose", "Condition", "Apply to Each", "Send Email"],
        rightOptions: [
          { id: "data_operations", label: "Data operations and transformations" },
          { id: "control_flow", label: "Control flow and decisions" },
          { id: "loops", label: "Looping over collections" },
          { id: "communication", label: "Communication and notifications" }
        ]
      }
    ]
  }
};

export function pickLogicReasoningPack(roleId: RoleId, stacks: StackId[]): LogicReasoningPack {
  const primaryStack = stacks[0] || "UiPath";
  const scenario = stackScenarios[primaryStack];

  return {
    id: `logic_reasoning_${primaryStack}_${roleId}`,
    roleGroup: ["Intern", "Associate", "SE"].includes(roleId) ? "core" : "senior_lead",
    stack: primaryStack,
    title: scenario.title,
    prompt: scenario.prompt,
    subtasks: scenario.subtasks
  };
}