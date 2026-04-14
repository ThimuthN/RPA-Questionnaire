import crypto from "node:crypto";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks, stripTypeScriptTypes } from "node:module";
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

function hasKnownExtension(value) {
  return /\.[a-z0-9]+$/i.test(value);
}

function resolveWorkspaceModule(rawPath) {
  const candidates = hasKnownExtension(rawPath)
    ? [rawPath]
    : [rawPath + ".ts", rawPath + ".tsx", rawPath + ".json", path.join(rawPath, "index.ts")];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? rawPath;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const absolute = resolveWorkspaceModule(path.join(process.cwd(), "src", specifier.slice(2)));
      return { url: pathToFileURL(absolute).href, shortCircuit: true };
    }

    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
      const parentPath = fileURLToPath(context.parentURL);
      const absolute = resolveWorkspaceModule(path.resolve(path.dirname(parentPath), specifier));
      if (fs.existsSync(absolute)) {
        return { url: pathToFileURL(absolute).href, shortCircuit: true };
      }
    }

    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".json")) {
      const json = fs.readFileSync(fileURLToPath(url), "utf8");
      return {
        format: "module",
        source: `export default ${json};`,
        shortCircuit: true
      };
    }

    if (url.endsWith(".ts") || url.endsWith(".tsx")) {
      const source = fs.readFileSync(fileURLToPath(url), "utf8");
      return {
        format: "module",
        source: stripTypeScriptTypes(source),
        shortCircuit: true
      };
    }

    return nextLoad(url, context);
  }
});

function stableId(seedKey) {
  return crypto.createHash("md5").update(seedKey).digest("hex");
}

async function main() {
  const { addonCatalogSeeds: seeds } = await import("@/lib/addons/catalog-seeds");
  let created = 0;
  let updated = 0;

  for (const seed of seeds) {
    const id = stableId(seed.seedKey);
    const existing = await prisma.addonCatalog.findFirst({
      where: {
        OR: [{ slug: seed.slug }, { id }]
      },
      select: { id: true }
    });

    const data = {
      slug: seed.slug,
      label: seed.label,
      description: seed.description,
      assessmentTypeId: seed.assessmentTypeId,
      defaultConfigJson: seed.defaultConfig,
      defaultDurationMinutes: seed.defaultDurationMinutes,
      defaultRequiredPercent: seed.defaultRequiredPercent,
      defaultWeight: seed.defaultWeight,
      isActive: seed.isActive,
      sortOrder: seed.sortOrder
    };

    if (existing) {
      await prisma.addonCatalog.update({
        where: { id: existing.id },
        data
      });
      updated += 1;
      continue;
    }

    await prisma.addonCatalog.create({
      data: {
        id,
        ...data
      }
    });

    created += 1;
  }

  console.log(`Addon catalog sync complete. Created: ${created}. Updated: ${updated}. Total seeds: ${seeds.length}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
