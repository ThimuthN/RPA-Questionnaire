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
    "contextType",
    "reviewState",
    "roleId",
    "stacks",
    "sections",
    "exams",
    "examMarks",
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
        row.contextType ?? "general",
        row.reviewState ?? "unreviewed",
        row.roleId,
        row.stacks.join("|"),
        row.sections.join("|"),
        row.exams.map((exam) => `${exam.label}${exam.configSummary ? ` (${exam.configSummary})` : ""}`).join("|"),
        row.exams
          .map((exam) => {
            const breakdown = row.examBreakdown[exam.instanceId];
            if (!breakdown) return `${exam.label}: no data`;
            return `${exam.label} ${breakdown.weightedMarksEarned.toFixed(1)}/${breakdown.weightedMarksPossible} (${breakdown.percent.toFixed(1)}%)`;
          })
          .join("|"),
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
