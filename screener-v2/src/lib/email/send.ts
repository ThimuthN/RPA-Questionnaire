import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — email not sent");
    return;
  }

  const fromEmail = process.env.EMAIL_FROM ?? "noreply@innobothealth.com";

  await resend.emails.send({
    from: fromEmail,
    to: opts.to,
    subject: opts.subject,
    html: opts.html
  });
}
