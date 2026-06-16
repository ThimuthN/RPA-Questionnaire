/**
 * Import all departments and designations from Staff Growth Plan spreadsheet
 *
 * Creates departments with IND and SL variants:
 * - RPA IND, RPA SL
 * - Software Engineering IND, Software Engineering SL
 * - RCM IND, RCM SL
 * - BA IND, BA SL
 * - BI IND, BI SL
 * - QA IND, QA SL
 * - HR IND, HR SL
 *
 * Idempotent: Safe to run multiple times
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

    const { departments, designations } = parseSpreadsheet(rows);
    console.log(`Found ${departments.length} departments with ${designations.length} total roles\n`);

    const deptMap = new Map<string, string>();
    let deptCreated = 0;
    let deptUpdated = 0;

    for (const deptName of departments) {
      for (const variant of ["IND", "SL"] as const) {
        const slug = `${deptName.toLowerCase().replace(/\s+/g, "-")}-${variant.toLowerCase()}`;
        const fullName = `${deptName} ${variant}`;

        const existing = await prisma.department.findUnique({
          where: { slug },
        });

        if (existing) {
          await prisma.department.update({
            where: { id: existing.id },
            data: { isActive: true, updatedAt: new Date() },
          });
          deptMap.set(`${deptName}|${variant}`, existing.id);
          deptUpdated++;
        } else {
          const dept = await prisma.department.create({
            data: {
              name: fullName,
              slug,
              isActive: true,
              sortOrder: 0,
            },
          });
          deptMap.set(`${deptName}|${variant}`, dept.id);
          deptCreated++;
        }
      }
    }

    console.log("Departments:");
    console.log(`   Created: ${deptCreated}`);
    console.log(`   Updated: ${deptUpdated}\n`);

    let jobsCreated = 0;
    let jobsUpdated = 0;

    for (const designation of designations) {
      const deptName = designation.department;

      for (const variant of ["IND", "SL"] as const) {
        const deptId = deptMap.get(`${deptName}|${variant}`);
        if (!deptId) continue;

        const jobSlug = `${deptName.toLowerCase().replace(/\s+/g, "-")}-${designation.title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "")
          .substring(0, 50)}-${variant.toLowerCase()}`;

        const existing = await prisma.jobPosting.findFirst({
          where: {
            departmentId: deptId,
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
          jobsUpdated++;
        } else {
          await prisma.jobPosting.create({
            data: {
              slug: jobSlug,
              title: designation.title,
              summary: `${designation.title} - ${deptName} ${variant}`,
              description: `Position: ${designation.title}\nDepartment: ${deptName} ${variant}\nSalary Range: LKR ${designation.salaryMin.toLocaleString()} - ${designation.salaryMax.toLocaleString()}`,
              departmentId: deptId,
              salaryMin: designation.salaryMin,
              salaryMax: designation.salaryMax,
              isPublished: false,
              isOpen: false,
            },
          });
          jobsCreated++;
        }
      }
    }

    console.log("Job Postings:");
    console.log(`   Created: ${jobsCreated}`);
    console.log(`   Updated: ${jobsUpdated}\n`);
    console.log("Import Summary:");
    console.log(`   Departments (with IND/SL): ${deptCreated + deptUpdated}`);
    console.log(`   Job Postings: ${jobsCreated + jobsUpdated}`);
    console.log("\nImport complete!");
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
  const result = {
    departments: [] as string[],
    designations: [] as Array<{ department: string; title: string; salaryMin: number; salaryMax: number }>,
  };

  let currentDept = "";

  for (const row of rows) {
    const value = cellText(row[0]);

    if (!value) continue;

    if (value.includes("Department -")) {
      currentDept = value.replace("Department - ", "").trim();
      if (!result.departments.includes(currentDept)) {
        result.departments.push(currentDept);
      }
      continue;
    }

    if (
      value === "Designation" ||
      value.includes("STAFF") ||
      value.includes("Version") ||
      value.includes("All")
    ) {
      continue;
    }

    const salaryMin = cellNumber(row[7]);
    const salaryMax = cellNumber(row[8]);

    if (salaryMin > 0 && salaryMax > 0 && currentDept) {
      result.designations.push({
        department: currentDept,
        title: value,
        salaryMin,
        salaryMax,
      });
    }
  }

  return result;
}

void importDesignations();
