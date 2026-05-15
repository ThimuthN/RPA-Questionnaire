export function screenerInviteEmail(input: {
  candidateName: string;
  jobTitle: string;
  orgName: string;
  inviteUrl: string;
  expiresAt: Date;
}): { subject: string; html: string } {
  const expiryDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(input.expiresAt);

  return {
    subject: `Your assessment for ${input.jobTitle} at ${input.orgName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Assessment Invite</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f9fafb;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 32px 24px;
    }
    .content p {
      margin: 0 0 16px 0;
      font-size: 15px;
    }
    .cta-button {
      display: inline-block;
      background-color: #667eea;
      color: white;
      padding: 14px 40px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      margin: 28px 0;
    }
    .cta-button:hover {
      background-color: #5568d3;
    }
    .expiry-warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .expiry-warning p {
      margin: 0;
      font-size: 13px;
      color: #92400e;
    }
    .instructions {
      background-color: #f0f9ff;
      border-left: 4px solid #667eea;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .instructions p {
      margin: 0 0 8px 0;
      font-size: 14px;
    }
    .instructions ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
      font-size: 14px;
    }
    .instructions li {
      margin-bottom: 4px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    .fallback-link {
      word-break: break-all;
      color: #667eea;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Assessment Awaits</h1>
      <p>${escapeHtml(input.jobTitle)} at ${escapeHtml(input.orgName)}</p>
    </div>
    <div class="content">
      <p>Hi ${escapeHtml(input.candidateName)},</p>
      <p>Your next step in the hiring process is to complete an online assessment. This helps us better understand your skills and how you approach problem-solving.</p>

      <div style="text-align: center;">
        <a href="${escapeHtml(input.inviteUrl)}" class="cta-button">Start Assessment</a>
      </div>

      <div class="instructions">
        <p><strong>What to expect:</strong></p>
        <ul>
          <li>A comprehensive online assessment designed for your role</li>
          <li>You'll have uninterrupted time to complete it</li>
          <li>A score and detailed feedback after submission</li>
        </ul>
      </div>

      <div class="expiry-warning">
        <p><strong>⏰ Important:</strong> This assessment link expires on <strong>${expiryDate}</strong>. Please complete it before then.</p>
      </div>

      <p>If you have any questions or need technical support, please reach out to us.</p>
      <p>Best of luck!<br /><strong>${escapeHtml(input.orgName)}</strong> Hiring Team</p>

      <div class="fallback-link">
        <p><strong>Or copy this link:</strong><br />${escapeHtml(input.inviteUrl)}</p>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
