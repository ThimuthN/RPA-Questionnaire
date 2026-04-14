import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const definitionsRelativePath = "src/lib/addons/definitions.ts";

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

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDefinitionId(value) {
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

function toCamelCase(value) {
  const parts = String(value).split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (parts.length === 0) return "newAddon";
  return `${parts[0].charAt(0).toLowerCase()}${parts[0].slice(1)}${parts
    .slice(1)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("")}`;
}

function usage() {
  console.log(
    [
      "Usage:",
      '  npm run addon:scaffold -- --slug coding-exam --id coding_exam --label "Coding Assessment"',
      "",
      "Options:",
      "  --slug      Feature folder slug under src/features/",
      "  --id        Exam definition id / assessment type id",
      "  --label     Product-facing label",
      "  --register  Insert the definition import and registry entry in src/lib/addons/definitions.ts",
      "  --dry-run   Print output without writing files"
    ].join("\n")
  );
}

function buildQuestionsModule({ exportBaseName, label }) {
  const builderName = `build${exportBaseName.charAt(0).toUpperCase()}${exportBaseName.slice(1)}Questions`;
  return `import type { ExamQuestion } from "@/lib/assessment-engine/types";

export const ${exportBaseName}Questions: ExamQuestion[] = [
  // Add ${label} questions here.
];

export function ${builderName}(_config: Record<string, unknown> = {}) {
  return ${exportBaseName}Questions;
}
`;
}

function buildDefinitionModule({ slug, definitionId, exportBaseName, label, definitionExportName }) {
  const builderName = `build${exportBaseName.charAt(0).toUpperCase()}${exportBaseName.slice(1)}Questions`;
  return `import type { AddonDefinitionRegistration } from "@/lib/addons/definitions";
import { ${builderName} } from "@/features/${slug}/questions";

export const ${definitionExportName} = {
  id: "${definitionId}",
  label: "${label}",
  description: "Describe what ${label} measures.",
  accentTone: "amber",
  scoreBarClass: "bg-[linear-gradient(90deg,rgba(245,158,11,0.95),rgba(251,191,36,0.88))]",
  panelClass:
    "border-amber-400/25 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--pill-amber-bg)_92%,var(--app-surface)),color-mix(in_srgb,var(--app-surface-soft)_96%,white))]",
  configFields: [],
  defaultWeight: 30,
  defaultConfig: {},
  libraryEntries: [
    {
      seedKey: "addon-${slug}-default",
      slug: "${slug}",
      sortOrder: 999
    }
  ],
  buildDurationMinutes: () => 30,
  buildConfigSummary: () => "${label}",
  buildRequiredPercent: (_config, fallbackPassPercent) => fallbackPassPercent,
  resolveItems: ${builderName}
} satisfies AddonDefinitionRegistration;
`;
}

function buildReadme({ slug, definitionId, label, exportBaseName, definitionExportName }) {
  const builderName = `build${exportBaseName.charAt(0).toUpperCase()}${exportBaseName.slice(1)}Questions`;
  return `# ${label}

Scaffolded add-on feature module for \`${definitionId}\`.

## Files

- \`questions.ts\`
  - export: \`${exportBaseName}Questions\`
  - builder: \`${builderName}()\`
- \`definition.ts\`
  - export: \`${definitionExportName}\`

## Next registration steps

1. Fill the question content in \`questions.ts\`
2. Finalize the authored metadata in \`definition.ts\`
3. Register the definition in \`src/lib/addons/definitions.ts\`
   - manual: add the import and registration entry yourself
   - assisted: \`npm run addon:scaffold -- --slug ${slug} --id ${definitionId} --label "${label}" --register\`
4. Finalize the \`libraryEntries\` list in \`definition.ts\`
5. Optionally add seeded presets in \`src/lib/addons/preset-seeds.json\`
6. Run:
   - \`npm run addons:bootstrap\`
   - \`npm.cmd run lint\`
   - \`npm.cmd test\`
   - \`npm.cmd run build\`

## If you need a new question format

Follow \`docs/QUESTION_FORMAT_AUTHORING.md\`, or start with:

\`\`\`powershell
npm run format:scaffold -- --id custom_format --label "Custom Format"
\`\`\`
`;
}

function buildChecklist({ slug, definitionId, label, definitionExportName }) {
  return [
    "",
    "Add-on scaffold created.",
    "",
    "Feature module:",
    `  src/features/${slug}/questions.ts`,
    `  src/features/${slug}/definition.ts`,
    "",
    "Add this import to src/lib/addons/definitions.ts:",
    `  import { ${definitionExportName} } from "@/features/${slug}/definition";`,
    "",
    "Add this registration entry to orderedAddonDefinitions:",
    `  ${definitionExportName}`,
    "",
    "Or automate that registry step once the add-on content is ready:",
    `  npm run addon:scaffold -- --slug ${slug} --id ${definitionId} --label "${label}" --register`,
    "",
    "Finalize the libraryEntries stub in src/features/<slug>/definition.ts:",
    `  libraryEntries: [`,
    `    {`,
    `      seedKey: "addon-${slug}-default",`,
    `      slug: "${slug}",`,
    `      sortOrder: 999`,
    `    }`,
    `  ]`,
    "",
    "Optional preset reminder:",
    `  Add a preset in src/lib/addons/preset-seeds.json if ${label} should ship as part of a curated bundle.`,
    "",
    "Then run:",
    "  npm run addons:bootstrap",
    "  npm.cmd run lint",
    "  npm.cmd test",
    "  npm.cmd run build",
    ""
  ].join("\n");
}

function detectNewline(value) {
  return value.includes("\r\n") ? "\r\n" : "\n";
}

function insertAfterLastImport(content, importLine, newline) {
  if (content.includes(importLine)) {
    return { content, changed: false };
  }

  const lines = content.split(newline);
  let lastImportIndex = -1;
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].startsWith("import ")) {
      lastImportIndex = index;
    }
  }

  if (lastImportIndex === -1) {
    throw new Error(`Could not find an import block in ${definitionsRelativePath}.`);
  }

  lines.splice(lastImportIndex + 1, 0, importLine);
  return { content: lines.join(newline), changed: true };
}

function insertRegistryEntry(content, definitionExportName, newline) {
  const registryLine = `  ${definitionExportName},`;
  if (content.includes(registryLine)) {
    return { content, changed: false };
  }

  const marker = `export const orderedAddonDefinitions = [${newline}`;
  const markerIndex = content.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Could not find orderedAddonDefinitions in ${definitionsRelativePath}.`);
  }

  const insertAt = content.indexOf(`] as const;`, markerIndex);
  if (insertAt === -1) {
    throw new Error(`Could not find the end of orderedAddonDefinitions in ${definitionsRelativePath}.`);
  }

  return {
    content: `${content.slice(0, insertAt)}${registryLine}${newline}${content.slice(insertAt)}`,
    changed: true
  };
}

async function registerAddonDefinition({ slug, definitionExportName, dryRun }) {
  const definitionsPath = path.join(process.cwd(), ...definitionsRelativePath.split("/"));
  const importLine = `import { ${definitionExportName} } from "@/features/${slug}/definition";`;
  const original = await fs.readFile(definitionsPath, "utf8");
  const newline = detectNewline(original);

  const importResult = insertAfterLastImport(original, importLine, newline);
  const registryResult = insertRegistryEntry(importResult.content, definitionExportName, newline);
  const changed = importResult.changed || registryResult.changed;

  if (!changed) {
    return {
      changed: false,
      summary: `${definitionsRelativePath} already contains ${definitionExportName}.`
    };
  }

  if (dryRun) {
    return {
      changed: true,
      summary: [
        `Would update ${definitionsRelativePath}:`,
        `  ${importLine}`,
        `  ${definitionExportName}`
      ].join("\n")
    };
  }

  await fs.writeFile(definitionsPath, registryResult.content, "utf8");
  return {
    changed: true,
    summary: `Updated ${definitionsRelativePath} with ${definitionExportName}.`
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.slug || !args.id || !args.label) {
    usage();
    process.exitCode = 1;
    return;
  }

  const slug = slugify(args.slug);
  const definitionId = toDefinitionId(args.id);
  const label = toLabel(args.label);
  const exportBaseName = toCamelCase(slug);
  const definitionExportName = `${exportBaseName}AddonDefinition`;
  const featureDir = path.join(process.cwd(), "src", "features", slug);
  const questionsPath = path.join(featureDir, "questions.ts");
  const definitionPath = path.join(featureDir, "definition.ts");
  const readmePath = path.join(featureDir, "README.md");

  const files = [
    {
      path: questionsPath,
      content: buildQuestionsModule({ exportBaseName, label })
    },
    {
      path: definitionPath,
      content: buildDefinitionModule({ slug, definitionId, exportBaseName, label, definitionExportName })
    },
    {
      path: readmePath,
      content: buildReadme({ slug, definitionId, label, exportBaseName, definitionExportName })
    }
  ];
  let registrationSummary = null;

  if (args["dry-run"]) {
    for (const file of files) {
      console.log(`--- ${path.relative(process.cwd(), file.path)} ---`);
      console.log(file.content);
    }
    if (args.register) {
      registrationSummary = await registerAddonDefinition({
        slug,
        definitionExportName,
        dryRun: true
      });
      console.log("");
      console.log(registrationSummary.summary);
    }
    console.log(buildChecklist({ slug, definitionId, label, definitionExportName }));
    return;
  }

  await fs.mkdir(featureDir, { recursive: true });

  for (const file of files) {
    try {
      await fs.access(file.path);
      console.error(`Skipped existing file: ${path.relative(process.cwd(), file.path)}`);
    } catch {
      await fs.writeFile(file.path, file.content, "utf8");
      console.log(`Created ${path.relative(process.cwd(), file.path)}`);
    }
  }

  if (args.register) {
    registrationSummary = await registerAddonDefinition({
      slug,
      definitionExportName,
      dryRun: false
    });
    console.log(registrationSummary.summary);
  }

  console.log(buildChecklist({ slug, definitionId, label, definitionExportName }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
