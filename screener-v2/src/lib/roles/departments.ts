export const DEFAULT_DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Operations",
  "QA",
  "Data"
];

// Backward compatibility function - returns static list
// During UI Phase A refactoring, this will be replaced with API calls to /api/departments
export function getDepartmentOptions(
  usedDepartments?: (string | undefined | null)[]
): string[] {
  if (!usedDepartments) {
    return DEFAULT_DEPARTMENTS.sort();
  }
  const customDepts = new Set(
    usedDepartments.filter((d): d is string => Boolean(d && d.trim()))
  );
  const allDepts = new Set([...DEFAULT_DEPARTMENTS, ...customDepts]);
  return Array.from(allDepts).sort();
}
