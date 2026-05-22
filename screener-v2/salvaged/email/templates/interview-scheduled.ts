export function interviewScheduledEmail(input: {
  candidateName: string;
  jobTitle: string;
  orgName: string;
  interviewerName: string;
  scheduledAt: Date;
  meetingLink?: string;
}): { subject: string; html: string } {
  const dateTime = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  }).format(input.scheduledAt);

  return {
    subject: `Interview Scheduled: ${input.jobTitle} at ${input.orgName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Interview Scheduled</title>
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
    .details-box {
      background-color: #f3f4f6;
      border-left: 4px solid #667eea;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .details-box p {
      margin: 0 0 12px 0;
      font-size: 14px;
    }
    .details-box p:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      color: #6b7280;
      font-weight: 500;
    }
    .detail-value {
      color: #111827;
      font-weight: 600;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Scheduled!</h1>
    </div>
    <div class="content">
      <p>Hi ${escapeHtml(input.candidateName)},</p>
      <p>Congratulations! We'd like to move forward with your interview for the <strong>${escapeHtml(input.jobTitle)}</strong> position at ${escapeHtml(input.orgName)}.</p>

      <div class="details-box">
        <p><span class="detail-label">Interviewer:</span><br /><span class="detail-value">${escapeHtml(input.interviewerName)}</span></p>
        <p><span class="detail-label">Scheduled for:</span><br /><span class="detail-value">${dateTime} UTC</span></p>
        ${input.meetingLink ? `<p><span class="detail-label">Meeting link:</span><br /><span class="detail-value"><a href="${escapeHtml(input.meetingLink)}" style="color: #667eea; text-decoration: none;">${escapeHtml(input.meetingLink)}</a></span></p>` : ""}
      </div>

      ${input.meetingLink ? `<div style="text-align: center;"><a href="${escapeHtml(input.meetingLink)}" class="cta-button">Join Interview</a></div>` : ""}

      <p>Please mark your calendar and let us know if you have any scheduling conflicts.</p>
      <p>Looking forward to meeting you!</p>
      <p>Best regards,<br /><strong>${escapeHtml(input.orgName)}</strong> Team</p>
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
