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

export function getDepartmentOptions(usedDepartments: (string | undefined | null)[]): string[] {
  const customDepts = new Set(usedDepartments.filter((d) => d && d.trim()));
  const allDepts = new Set([...DEFAULT_DEPARTMENTS, ...customDepts]);
  return Array.from(allDepts).sort();
}
