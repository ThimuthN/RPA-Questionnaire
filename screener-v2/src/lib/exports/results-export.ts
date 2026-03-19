import type { ResultSummary } from "@/lib/assessment-engine/types";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function resultsToCsv(rows: ResultSummary[]): string {
  const header = [
    "attemptId",
    "candidateName",
    "candidateEmail",
    "roleId",
    "stacks",
    "sections",
    "exams",
    "passPercent",
    "corePercent",
    "practicalPercent",
    "finalPercent",
    "pass",
    "borderline",
    "sectionPasses",
    "sectionBreakdown"
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.attemptId,
        row.candidateName ?? "",
        row.candidateEmail ?? "",
        row.roleId,
        row.stacks.join("|"),
        row.sections.join("|"),
        row.exams.map((exam) => `${exam.label}${exam.configSummary ? ` (${exam.configSummary})` : ""}`).join("|"),
        row.passPercent,
        row.corePercent,
        row.practicalPercent,
        row.finalPercent,
        row.pass,
        row.borderline,
        JSON.stringify(
          Object.fromEntries(
            row.sections.map((sectionId) => [sectionId, row.sectionBreakdown[sectionId]?.pass ?? false])
          )
        ),
        JSON.stringify(row.sectionBreakdown)
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  return lines.join("\r\n");
}
