/**
 * Import company designations from Staff Growth Plan spreadsheet
 *
 * Reads: Designations - Staff Growth - Agust 18th 9.xlsx
 * Creates: JobPosting records for each designation with salary bands
 * Idempotent: Updates existing by department + title
 */

import { PrismaClient } from "@prisma/client";
import XLSX from "xlsx";
import path from "path";

const prisma = new PrismaClient();

async function importDesignations() {
  try {
    // Find spreadsheet
    const spreadsheetPath = path.join(
      process.env.HOME || process.env.USERPROFILE || "C:\\Users\\USER",
      "Downloads",
      "Designations - Staff Growth - Agust 18th 9.xlsx"
    );

    console.log(`📂 Reading: ${spreadsheetPath}`);
    const workbook = XLSX.readFile(spreadsheetPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // Parse spreadsheet
    const designations = parseSpreadsheet(sheet);
    console.log(`✅ Found ${designations.length} designations`);

    // Get or create RPA department
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
      console.log(`✅ Created RPA department`);
    }

    // Upsert job postings
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
        // Update
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
        // Create
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

    console.log(`\n✅ Import complete:`);
    console.log(`   Created: ${created} new job postings`);
    console.log(`   Updated: ${updated} existing`);
    console.log(`   Total: ${created + updated} designations`);
  } catch (err) {
    console.error("❌ Import failed:", (err as Error).message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function parseSpreadsheet(sheet: XLSX.WorkSheet): Array<{
  title: string;
  salaryMin: number;
  salaryMax: number;
}> {
  const result: Array<{
    title: string;
    salaryMin: number;
    salaryMax: number;
  }> = [];
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:Z1000");

  // Find data start (row with "Designation" header)
  let headerRow = -1;
  for (let r = 0; r <= range.e.r; r++) {
    const cell = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
    if (cell?.v === "Designation") {
      headerRow = r;
      break;
    }
  }

  if (headerRow === -1) {
    throw new Error("Could not find 'Designation' header");
  }

  // Parse rows after header
  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const titleCell = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
    const title = titleCell?.v?.toString().trim();

    if (!title) break; // End of data

    // Find salary columns (LKR LOW, LKR HIGH, USD LOW, USD HIGH)
    const salaryMinCell = sheet[XLSX.utils.encode_cell({ r, c: 7 })]; // Column 8 (H)
    const salaryMaxCell = sheet[XLSX.utils.encode_cell({ r, c: 8 })]; // Column 9 (I)

    const salaryMin = salaryMinCell?.v ? Math.round(Number(salaryMinCell.v)) : 0;
    const salaryMax = salaryMaxCell?.v ? Math.round(Number(salaryMaxCell.v)) : 0;

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

importDesignations();
