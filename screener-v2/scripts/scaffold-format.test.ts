import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("format scaffold", () => {
  it("prints the generated stubs and checklist doc in dry-run mode", () => {
    const output = execFileSync(
      process.execPath,
      [
        path.join(process.cwd(), "scripts", "scaffold-format.mjs"),
        "--id",
        "code_editor",
        "--label",
        "Code Editor",
        "--dry-run"
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8"
      }
    );

    expect(output).toContain("src/lib/question-types/code-editor.ts");
    expect(output).toContain("src/components/runtime/renderers/CodeEditorRenderer.tsx");
    expect(output).toContain("docs/format-scaffolds/code-editor.md");
    expect(output).toContain('type: "code_editor"');
    expect(output).toContain('questionScoringRegistry["code_editor"]');
    expect(output).toContain('QuestionFormatId -> "code_editor"');
    expect(output).toContain("questionRegistry -> codeEditorDef");
  });
});
