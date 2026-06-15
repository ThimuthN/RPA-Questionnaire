// Shared salary currency handling for job postings.
// Matches the currencies supported by the applicant intake questionnaire (USD / INR / LKR).

export const SALARY_CURRENCIES = ["USD", "INR", "LKR"] as const;
export type SalaryCurrency = (typeof SALARY_CURRENCIES)[number];

export const DEFAULT_SALARY_CURRENCY: SalaryCurrency = "USD";

const SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  LKR: "Rs"
};

export const SALARY_CURRENCY_OPTIONS: { value: SalaryCurrency; label: string }[] = [
  { value: "USD", label: "USD ($)" },
  { value: "INR", label: "INR (₹)" },
  { value: "LKR", label: "LKR (Rs)" }
];

export function normalizeSalaryCurrency(code?: string | null): SalaryCurrency {
  const upper = (code ?? "").toUpperCase();
  return (SALARY_CURRENCIES as readonly string[]).includes(upper)
    ? (upper as SalaryCurrency)
    : DEFAULT_SALARY_CURRENCY;
}

export function currencySymbol(code?: string | null): string {
  return SYMBOLS[normalizeSalaryCurrency(code)];
}

/** Compact range, e.g. "$120k–$150k", "₹12k+", or "Rs 90k". Returns null when no salary is set. */
export function formatSalaryRange(
  min?: number | null,
  max?: number | null,
  currency?: string | null
): string | null {
  const sym = currencySymbol(currency);
  const k = (value: number) => `${sym}${(value / 1000).toFixed(0)}k`;
  if (min && max) return `${k(min)}–${k(max)}`;
  if (min) return `${k(min)}+`;
  if (max) return k(max);
  return null;
}
