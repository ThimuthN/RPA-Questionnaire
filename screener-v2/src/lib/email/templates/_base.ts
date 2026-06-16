export interface BaseEmailVars {
  orgName: string;
  previewText?: string;
}

const BRAND = "#0aa6a0";
const BRAND_DARK = "#0f2336";

export function baseLayout(vars: BaseEmailVars, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light" />
<title>${vars.orgName}</title>
${vars.previewText ? `<span style="display:none;max-height:0;overflow:hidden;">${vars.previewText}</span>` : ""}
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${BRAND},${BRAND_DARK});border-radius:16px 16px 0 0;padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${vars.orgName}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
              This email was sent by ${vars.orgName}. If you believe you received this in error, please disregard it.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.4px;">${text}</h1>`;
}

export function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;">${text}</p>`;
}

export function muted(text: string): string {
  return `<p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#6b7280;">${text}</p>`;
}

export function hr(): string {
  return `<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />`;
}

export function ctaButton(label: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background:linear-gradient(135deg,${BRAND},${BRAND_DARK});border-radius:10px;">
      <a href="${href}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">${label}</a>
    </td>
  </tr>
</table>`;
}

export function infoRow(label: string, value: string): string {
  return `<tr>
  <td style="padding:8px 0;font-size:13px;color:#6b7280;white-space:nowrap;vertical-align:top;">${label}</td>
  <td style="padding:8px 0 8px 16px;font-size:13px;font-weight:500;color:#111827;vertical-align:top;">${value}</td>
</tr>`;
}

export function infoTable(rows: string[]): string {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:4px 16px;margin:16px 0;">
  ${rows.join("")}
</table>`;
}
