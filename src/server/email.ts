import { Resend } from "resend";
import { env } from "~/env";
import { logger } from "~/lib/logger";

const log = logger.child({ module: "email" });

const resend = new Resend(env.RESEND_API_KEY);

const ADMIN_EMAIL = "cassius.reynolds.dev@gmail.com";

interface FeedbackEmailParams {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendFeedbackEmail({
  name,
  email,
  subject,
  message,
}: FeedbackEmailParams) {
  const { error } = await resend.emails.send({
    from: "Lineup Legends <onboarding@resend.dev>",
    to: ADMIN_EMAIL,
    subject: `[Lineup Legends Feedback] ${subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d4a843;">New Feedback from Lineup Legends</h2>
        <hr style="border: 1px solid #e5e7eb;" />
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <h3 style="margin-top: 24px;">Message:</h3>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${message}</div>
        <hr style="border: 1px solid #e5e7eb; margin-top: 24px;" />
        <p style="color: #6b7280; font-size: 12px;">
          This email was sent from the Lineup Legends contact form.
        </p>
      </div>
    `,
    replyTo: email,
  });

  if (error) {
    log.error({ err: error }, "Failed to send feedback email");
    throw new Error("Failed to send feedback email");
  }
}
