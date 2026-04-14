import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const seedsPath = path.join(process.cwd(), "src", "lib", "addons", "preset-seeds.json");
const seeds = JSON.parse(fs.readFileSync(seedsPath, "utf8"));

function stableId(seedKey) {
  return crypto.createHash("md5").update(seedKey).digest("hex");
}

async function main() {
  let created = 0;
  let updated = 0;

  const addonRows = await prisma.addonCatalog.findMany({
    select: { id: true, slug: true }
  });
  const addonIdBySlug = new Map(addonRows.map((addon) => [addon.slug, addon.id]));

  for (const seed of seeds) {
    const id = stableId(seed.seedKey);
    const existing = await prisma.assessmentPreset.findFirst({
      where: {
        OR: [{ slug: seed.slug }, { id }]
      },
      select: { id: true }
    });

    const itemRows = seed.items.map((item, index) => {
      const addonId = addonIdBySlug.get(item.addonSlug);
      if (!addonId) {
        throw new Error(`Preset seed '${seed.slug}' references unknown add-on slug '${item.addonSlug}'.`);
      }

      return {
        addonId,
        sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index,
        configOverrideJson: item.configOverride ?? {},
        weightOverride:
          typeof item.weightOverride === "number" ? Math.max(0, Math.round(item.weightOverride)) : null
      };
    });

    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.assessmentPreset.update({
          where: { id: existing.id },
          data: {
            slug: seed.slug,
            label: seed.label,
            description: seed.description,
            isActive: seed.isActive,
            sortOrder: seed.sortOrder
          }
        });

        await tx.assessmentPresetItem.deleteMany({
          where: { presetId: existing.id }
        });

        await tx.assessmentPresetItem.createMany({
          data: itemRows.map((item) => ({
            presetId: existing.id,
            ...item
          }))
        });
      });

      updated += 1;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.assessmentPreset.create({
        data: {
          id,
          slug: seed.slug,
          label: seed.label,
          description: seed.description,
          isActive: seed.isActive,
          sortOrder: seed.sortOrder
        }
      });

      await tx.assessmentPresetItem.createMany({
        data: itemRows.map((item) => ({
          presetId: id,
          ...item
        }))
      });
    });

    created += 1;
  }

  console.log(`Addon preset sync complete. Created: ${created}. Updated: ${updated}. Total seeds: ${seeds.length}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
