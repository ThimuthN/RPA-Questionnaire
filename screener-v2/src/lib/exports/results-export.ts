import type { ResultSummary } from "@/lib/assessment-engine/types";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function resultsToCsv(rows: ResultSummary[]): string {
  const header = [
    "attemptId",
    "roleId",
    "stacks",
    "sections",
    "corePercent",
    "practicalPercent",
    "finalPercent",
    "pass",
    "borderline",
    "sectionBreakdown"
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.attemptId,
        row.roleId,
        row.stacks.join("|"),
        row.sections.join("|"),
        row.corePercent,
        row.practicalPercent,
        row.finalPercent,
        row.pass,
        row.borderline,
        JSON.stringify(row.sectionBreakdown)
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  return lines.join("\r\n");
}
