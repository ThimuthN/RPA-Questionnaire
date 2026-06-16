/**
 * Import company designations from Staff Growth Plan spreadsheet
 *
 * Reads: Designations - Staff Growth - Agust 18th 9.xlsx
 * Creates: JobPosting records for each designation with salary bands
 * Idempotent: Updates existing by department + title
 */

import { PrismaClient } from "@prisma/client";
import path from "path";
import readXlsxFile from "read-excel-file/node";

const prisma = new PrismaClient();

async function importDesignations() {
  try {
    const spreadsheetPath = path.join(
      process.env.HOME || process.env.USERPROFILE || "C:\\Users\\USER",
      "Downloads",
      "Designations - Staff Growth - Agust 18th 9.xlsx"
    );

    console.log(`Reading: ${spreadsheetPath}`);
    const rows = (await readXlsxFile(spreadsheetPath)) as unknown as Array<Array<unknown>>;

    const designations = parseSpreadsheet(rows);
    console.log(`Found ${designations.length} designations`);

    let department = await prisma.department.findUnique({
      where: { slug: "rpa" },
    });

    if (!department) {
      department = await prisma.department.create({
        data: {
          name: "RPA",
          slug: "rpa",
          isActive: true,
          sortOrder: 1,
        },
      });
      console.log("Created RPA department");
    }

    let created = 0;
    let updated = 0;

    for (const designation of designations) {
      const slug = designation.title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "")
        .substring(0, 50);

      const existing = await prisma.jobPosting.findFirst({
        where: {
          departmentId: department.id,
          title: designation.title,
        },
      });

      if (existing) {
        await prisma.jobPosting.update({
          where: { id: existing.id },
          data: {
            salaryMin: designation.salaryMin,
            salaryMax: designation.salaryMax,
            updatedAt: new Date(),
          },
        });
        updated++;
      } else {
        await prisma.jobPosting.create({
          data: {
            slug,
            title: designation.title,
            summary: `${designation.title} Position`,
            description: `RPA Developer Position: ${designation.title}\n\nStaff Growth Plan 2024\nDepartment: RPA\n\nSalary Range: LKR ${designation.salaryMin.toLocaleString()} - ${designation.salaryMax.toLocaleString()}`,
            departmentId: department.id,
            salaryMin: designation.salaryMin,
            salaryMax: designation.salaryMax,
            isPublished: false,
            isOpen: false,
          },
        });
        created++;
      }
    }

    console.log("\nImport complete:");
    console.log(`   Created: ${created} new job postings`);
    console.log(`   Updated: ${updated} existing`);
    console.log(`   Total: ${created + updated} designations`);
  } catch (err) {
    console.error("Import failed:", (err as Error).message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function cellText(value: unknown) {
  if (value == null) return "";
  return String(value).trim();
}

function cellNumber(value: unknown) {
  if (typeof value === "number") return Math.round(value);
  const parsed = Number(cellText(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function parseSpreadsheet(rows: ReadonlyArray<ReadonlyArray<unknown>>) {
  const result: Array<{
    title: string;
    salaryMin: number;
    salaryMax: number;
  }> = [];

  const headerRow = rows.findIndex((row) => cellText(row[0]) === "Designation");
  if (headerRow === -1) {
    throw new Error("Could not find 'Designation' header");
  }

  for (let rowNumber = headerRow + 1; rowNumber < rows.length; rowNumber += 1) {
    const row = rows[rowNumber] ?? [];
    const title = cellText(row[0]);

    if (!title) break;

    const salaryMin = cellNumber(row[7]);
    const salaryMax = cellNumber(row[8]);

    if (salaryMin > 0 && salaryMax > 0) {
      result.push({
        title,
        salaryMin,
        salaryMax,
      });
    }
  }

  return result;
}

void importDesignations();
