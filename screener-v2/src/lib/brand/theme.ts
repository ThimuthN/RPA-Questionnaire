// Single-tenant white-label: a deployment can re-skin the brand accent to the client's
// color via NEXT_PUBLIC_BRAND_PRIMARY (a hex color). Northstar teal is the default.
// The value is strictly hex-validated before being rendered into a <style> tag to
// eliminate any CSS/style-injection risk.

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function brandPrimary(): string | null {
  const value = process.env.NEXT_PUBLIC_BRAND_PRIMARY?.trim();
  return value && HEX.test(value) ? value : null;
}

/**
 * Returns a CSS string overriding the brand accent across light & dark themes,
 * or null when no (valid) brand color is configured. Safe to inline — the color
 * is validated as a strict hex token.
 */
export function brandThemeCss(): string | null {
  const c = brandPrimary();
  if (!c) return null;
  return [
    ':root,html[data-theme="light"],html[data-theme="dark"]{',
    `--app-brand:${c};`,
    `--app-brand-strong:color-mix(in srgb, ${c} 82%, black);`,
    `--app-brand-soft:color-mix(in srgb, ${c} 14%, transparent);`,
    `--pub-brand:${c};`,
    `--pub-active-text:color-mix(in srgb, ${c} 88%, black);`,
    `--hero-accent-teal:${c};`,
    "}"
  ].join("");
}
