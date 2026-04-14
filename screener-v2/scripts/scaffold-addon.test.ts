import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("addon scaffold", () => {
  it("prints the authored file set and registration checklist in dry-run mode", () => {
    const output = execFileSync(
      process.execPath,
      [
        path.join(process.cwd(), "scripts", "scaffold-addon.mjs"),
        "--slug",
        "example-addon",
        "--id",
        "example_exam",
        "--label",
        "Example Addon",
        "--register",
        "--dry-run"
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8"
      }
    );

    expect(output).toContain("src/features/example-addon/questions.ts");
    expect(output).toContain("src/features/example-addon/definition.ts");
    expect(output).toContain("Would update src/lib/addons/definitions.ts:");
    expect(output).toContain('import { exampleAddonAddonDefinition } from "@/features/example-addon/definition";');
    expect(output).toContain('seedKey: "addon-example-addon-default"');
    expect(output).toContain("libraryEntries: [");
    expect(output).toContain('npm run addon:scaffold -- --slug example-addon --id example_exam --label "Example Addon" --register');
    expect(output).toContain("npm run addons:bootstrap");
  });

  it("registers the addon definition without duplicating the import or registry entry", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "addon-scaffold-"));

    try {
      const definitionsPath = path.join(tempDir, "src", "lib", "addons", "definitions.ts");
      fs.mkdirSync(path.dirname(definitionsPath), { recursive: true });
      fs.writeFileSync(
        definitionsPath,
        [
          'import { coreAddonDefinition } from "@/features/core/definition";',
          "",
          "export interface AddonDefinitionRegistration {",
          "  id: string;",
          "}",
          "",
          "export const orderedAddonDefinitions = [",
          "  coreAddonDefinition,",
          "] as const;",
          ""
        ].join("\n"),
        "utf8"
      );

      const commandArgs = [
        path.join(process.cwd(), "scripts", "scaffold-addon.mjs"),
        "--slug",
        "example-addon",
        "--id",
        "example_exam",
        "--label",
        "Example Addon",
        "--register"
      ];

      execFileSync(process.execPath, commandArgs, {
        cwd: tempDir,
        encoding: "utf8"
      });

      execFileSync(process.execPath, commandArgs, {
        cwd: tempDir,
        encoding: "utf8"
      });

      const definitions = fs.readFileSync(definitionsPath, "utf8");
      const importMatches =
        definitions.match(/import \{ exampleAddonAddonDefinition \} from "@\/features\/example-addon\/definition";/g) ??
        [];
      const registryMatches = definitions.match(/^\s*exampleAddonAddonDefinition,$/gm) ?? [];

      expect(importMatches).toHaveLength(1);
      expect(registryMatches).toHaveLength(1);
      expect(fs.existsSync(path.join(tempDir, "src", "features", "example-addon", "definition.ts"))).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
