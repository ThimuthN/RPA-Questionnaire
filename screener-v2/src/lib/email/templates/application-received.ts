export function applicationReceivedEmail(input: {
  candidateName: string;
  jobTitle: string;
  applicationId: string;
  orgName: string;
  statusUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Application received for ${input.jobTitle} at ${input.orgName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Received</title>
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
    .content {
      padding: 32px 24px;
    }
    .content p {
      margin: 0 0 16px 0;
      font-size: 15px;
    }
    .reference-box {
      background-color: #f3f4f6;
      border-left: 4px solid #667eea;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .reference-box p {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
    }
    .reference-box .id {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin-top: 8px;
      font-family: "Courier New", monospace;
    }
    .cta-button {
      display: inline-block;
      background-color: #667eea;
      color: white;
      padding: 12px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      margin: 24px 0;
    }
    .cta-button:hover {
      background-color: #5568d3;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Received!</h1>
    </div>
    <div class="content">
      <p>Hi ${escapeHtml(input.candidateName)},</p>
      <p>Thank you for applying for the <strong>${escapeHtml(input.jobTitle)}</strong> role at ${escapeHtml(input.orgName)}. We've received your application and will review it carefully.</p>

      <div class="reference-box">
        <p>Your application reference number:</p>
        <div class="id">${escapeHtml(input.applicationId)}</div>
      </div>

      <p>You can check the status of your application at any time using your reference number:</p>

      <div style="text-align: center;">
        <a href="${escapeHtml(input.statusUrl)}" class="cta-button">Check Application Status</a>
      </div>

      <p>We'll keep you updated as we progress through our hiring process. If you have any questions, feel free to reach out.</p>
      <p>Best regards,<br /><strong>${escapeHtml(input.orgName)}</strong> Hiring Team</p>
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
