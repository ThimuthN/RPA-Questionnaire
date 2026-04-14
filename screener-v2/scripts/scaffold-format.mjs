import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith("--")) continue;
    const key = current.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function toKebab(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toSnake(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toLabel(value) {
  return String(value)
    .trim()
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toPascal(value) {
  return String(value)
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function usage() {
  console.log(
    [
      "Usage:",
      '  npm run format:scaffold -- --id coding_editor --label "Coding Editor"',
      "",
      "Options:",
      "  --id        New QuestionFormatId value",
      "  --label     Product-facing label",
      "  --dry-run   Print output without writing files"
    ].join("\n")
  );
}

function buildQuestionTypeModule({ formatId, label, rendererName, definitionName }) {
  return `import { z } from "zod";
import type { QuestionTypeDef } from "@/lib/question-types/types";
import { commonQuestionSchema, reviewLines } from "@/lib/question-types/_base";
import { ${rendererName} } from "@/components/runtime/renderers/${rendererName}";
import { GenericReviewRenderer } from "@/components/runtime/renderers/ReviewRenderer";

export const ${definitionName}: QuestionTypeDef<any, string, { lines: string[] }> = {
  type: "${formatId}",
  runtimeLabel: "${label}",
  runtimeHint: "Replace this scaffold hint with the real interaction guidance.",
  schema: commonQuestionSchema.extend({
    prompt: z.string().min(1)
  }),
  answerSchema: z.string(),
  validateAnswer: (_question, answer) => ({
    ok: typeof answer === "string" && answer.trim().length > 0,
    reason: "Provide a response before continuing."
  }),
  score: () => ({
    normalized: 0,
    pointsEarned: 0,
    isCorrect: false
  }),
  toReviewModel: reviewLines,
  Renderer: ${rendererName},
  ReviewRenderer: GenericReviewRenderer
};
`;
}

function buildRendererModule({ label, rendererName }) {
  return `"use client";

import type { BaseQuestionRendererProps } from "@/components/runtime/renderers/types";

export function ${rendererName}({ question, answer, onChange }: BaseQuestionRendererProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">
        Replace this scaffold with the real ${label} interaction.
      </p>
      <textarea
        className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-100 outline-none"
        value={typeof answer === "string" ? answer : \"\"}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-xs text-slate-500">
        Current prompt: {question?.prompt ?? "No prompt provided."}
      </p>
    </div>
  );
}
`;
}

function buildTestModule({ formatId, definitionName }) {
  return `import { describe, expect, it } from "vitest";
import { ${definitionName} } from "@/lib/question-types/${formatId.replace(/_/g, "-")}";

describe("${formatId} question type scaffold", () => {
  it("keeps the authored type id stable", () => {
    expect(${definitionName}.type).toBe("${formatId}");
  });
});
`;
}

function buildChecklistDoc({ formatId, label, definitionName, rendererName }) {
  return `# ${label} Format Checklist

Scaffolded format id: \`${formatId}\`

## Registration seams

1. Add \`${formatId}\` to \`QuestionFormatId\` in \`src/lib/assessment-engine/types.ts\`
2. Register \`${definitionName}\` in \`src/lib/question-types/index.ts\`
3. Register runtime metadata in \`src/components/runtime/renderers/registry.tsx\`
   - label
   - hint
   - renderer: \`${rendererName}\`
4. If the format is auto-scored, register a scorer in \`src/lib/question-types/scoring-registry.ts\`
5. Add any format-specific tests and review-model assertions

## Scoring registration stub

\`\`\`ts
// src/lib/question-types/scoring-registry.ts
questionScoringRegistry["${formatId}"] = (question, answer, method) => {
  // Replace with real scoring logic for ${label}.
  return 0;
};
\`\`\`

## Review and validation checklist

- Can the answer be validated without DOM inspection?
- Is the saved answer shape stable across refresh/review?
- Does the renderer support keyboard-only input if practical?
- Does the review model show enough evidence for manual review?
- If auto-scored, does scoring handle partial / invalid answers safely?
- If not auto-scored, have you intentionally left scoring out of the auto-score registry?
`;
}

function buildChecklist({ formatId, label, formatFileBase, definitionName, rendererName }) {
  return [
    "",
    "Format scaffold created.",
    "",
    "Add these registrations next:",
    `  1. QuestionFormatId -> "${formatId}" in src/lib/assessment-engine/types.ts`,
    `  2. questionRegistry -> ${definitionName} in src/lib/question-types/index.ts`,
    `  3. runtime renderer -> ${rendererName} in src/components/runtime/renderers/registry.tsx`,
    `  4. optional scorer -> questionScoringRegistry["${formatId}"] in src/lib/question-types/scoring-registry.ts`,
    "",
    "Generated files:",
    `  src/lib/question-types/${formatFileBase}.ts`,
    `  src/components/runtime/renderers/${rendererName}.tsx`,
    `  src/lib/question-types/${formatFileBase}.test.ts`,
    `  docs/format-scaffolds/${formatFileBase}.md`,
    "",
    `Use the checklist doc for ${label}:`,
    `  docs/format-scaffolds/${formatFileBase}.md`,
    "",
    "Then run:",
    "  npm.cmd run lint",
    "  npm.cmd test",
    "  npm.cmd run build",
    ""
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.id || !args.label) {
    usage();
    process.exitCode = 1;
    return;
  }

  const formatId = toSnake(args.id);
  const formatFileBase = toKebab(args.id);
  const label = toLabel(args.label);
  const pascal = toPascal(formatId);
  const definitionName = `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}Def`;
  const rendererName = `${pascal}Renderer`;

  const questionTypePath = path.join(process.cwd(), "src", "lib", "question-types", `${formatFileBase}.ts`);
  const rendererPath = path.join(
    process.cwd(),
    "src",
    "components",
    "runtime",
    "renderers",
    `${rendererName}.tsx`
  );
  const testPath = path.join(process.cwd(), "src", "lib", "question-types", `${formatFileBase}.test.ts`);
  const checklistPath = path.join(process.cwd(), "docs", "format-scaffolds", `${formatFileBase}.md`);

  const files = [
    {
      path: questionTypePath,
      content: buildQuestionTypeModule({ formatId, label, rendererName, definitionName })
    },
    {
      path: rendererPath,
      content: buildRendererModule({ label, rendererName })
    },
    {
      path: testPath,
      content: buildTestModule({ formatId, definitionName })
    },
    {
      path: checklistPath,
      content: buildChecklistDoc({ formatId, label, definitionName, rendererName })
    }
  ];

  if (args["dry-run"]) {
    for (const file of files) {
      console.log(`--- ${path.relative(process.cwd(), file.path)} ---`);
      console.log(file.content);
    }
    console.log(buildChecklist({ formatId, label, formatFileBase, definitionName, rendererName }));
    return;
  }

  await fs.mkdir(path.dirname(questionTypePath), { recursive: true });
  await fs.mkdir(path.dirname(rendererPath), { recursive: true });
  await fs.mkdir(path.dirname(checklistPath), { recursive: true });

  for (const file of files) {
    try {
      await fs.access(file.path);
      console.error(`Skipped existing file: ${path.relative(process.cwd(), file.path)}`);
    } catch {
      await fs.writeFile(file.path, file.content, "utf8");
      console.log(`Created ${path.relative(process.cwd(), file.path)}`);
    }
  }

  console.log(buildChecklist({ formatId, label, formatFileBase, definitionName, rendererName }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
