export interface ParsedCandidateCsvRow {
  fullName: string;
  email: string;
  phone?: string;
  positionAppliedFor?: string;
  hrOwner?: string;
  batchId?: string;
  resumeSource?: string;
  notesSummary?: string;
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function parseCandidateCsv(text: string): ParsedCandidateCsvRow[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("Upload a CSV with a header row and at least one candidate.");
  }

  const header = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const required = ["fullname", "email"];
  for (const column of required) {
    if (!header.includes(column)) {
      throw new Error("CSV must include fullName and email columns.");
    }
  }

  return lines.slice(1).map((line, rowIndex) => {
    const values = parseCsvLine(line);
    const record = Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""]));
    const fullName = String(record.fullname || "").trim();
    const email = String(record.email || "").trim().toLowerCase();

    if (!fullName || !email) {
      throw new Error(`Row ${rowIndex + 2} must include fullName and email.`);
    }

    return {
      fullName,
      email,
      phone: String(record.phone || "").trim() || undefined,
      positionAppliedFor: String(record.positionappliedfor || record.role || "").trim() || undefined,
      hrOwner: String(record.hrowner || record.owner || "").trim() || undefined,
      batchId: String(record.batchid || "").trim() || undefined,
      resumeSource: String(record.resumesource || "").trim() || undefined,
      notesSummary: String(record.notessummary || "").trim() || undefined
    };
  });
}
