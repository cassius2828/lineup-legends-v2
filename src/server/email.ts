import { Resend } from "resend";
import { env } from "~/env";
import { logger } from "~/lib/logger";

const log = logger.child({ module: "email" });

let _resend: Resend | null = null;
function getResend(): Resend {
  return (_resend ??= new Resend(env.RESEND_API_KEY));
}

const ADMIN_EMAIL = "cassius.reynolds.dev@gmail.com";
const FROM_ADDRESS = "Lineup Legends <onboarding@resend.dev>";

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
  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
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

export async function sendEmailChangeConfirmation({
  to,
  confirmUrl,
}: {
  to: string;
  confirmUrl: string;
}) {
  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Confirm Your New Email Address",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d4a843;">Email Change Confirmation</h2>
        <hr style="border: 1px solid #e5e7eb;" />
        <p>You requested to change your email address on Lineup Legends. Click the button below to confirm:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${confirmUrl}" style="background: #d4a843; color: #000; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Confirm Email</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this change, you can safely ignore this email.</p>
        <hr style="border: 1px solid #e5e7eb; margin-top: 24px;" />
        <p style="color: #6b7280; font-size: 12px;">Lineup Legends</p>
      </div>
    `,
  });

  if (error) {
    log.error({ err: error }, "Failed to send email change confirmation");
    throw new Error("Failed to send email change confirmation");
  }
}

export async function sendMfaCode({ to, code }: { to: string; code: string }) {
  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Your Lineup Legends Verification Code",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d4a843;">Verification Code</h2>
        <hr style="border: 1px solid #e5e7eb;" />
        <p>Your verification code is:</p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #d4a843;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes. If you didn't request this code, please secure your account.</p>
        <hr style="border: 1px solid #e5e7eb; margin-top: 24px;" />
        <p style="color: #6b7280; font-size: 12px;">Lineup Legends</p>
      </div>
    `,
  });

  if (error) {
    log.error({ err: error }, "Failed to send MFA code email");
    throw new Error("Failed to send verification code");
  }
}

interface PasswordResetEmailParams {
  to: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: PasswordResetEmailParams) {
  log.info({ to }, "Attempting to send password reset email");
  const { data, error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Reset your Lineup Legends password",
    html: `
      <div style="background-color: #0a0a0a; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #141414; border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 12px; overflow: hidden;">
          <!-- Header -->
          <div style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <h1 style="margin: 0; font-size: 28px; letter-spacing: 3px; text-transform: uppercase;">
              <span style="color: #D4AF37; font-weight: 700;">Lineup</span>
              <span style="color: #f5f5f5; font-weight: 700;"> Legends</span>
            </h1>
          </div>

          <!-- Body -->
          <div style="padding: 32px;">
            <h2 style="color: #f5f5f5; font-size: 18px; font-weight: 600; margin: 0 0 12px;">Reset your password</h2>
            <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              We received a request to reset your password. Click the button below to choose a new one.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 0 0 24px;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #D4AF37; color: #0a0a0a; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; letter-spacing: 0.5px;">
                Reset Password
              </a>
            </div>

            <p style="color: #737373; font-size: 12px; line-height: 1.5; margin: 0 0 16px; text-align: center;">
              This link expires in <strong style="color: #a3a3a3;">5 minutes</strong>.
            </p>

            <!-- Fallback URL -->
            <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 12px; margin: 0 0 8px;">
              <p style="color: #737373; font-size: 11px; margin: 0 0 4px;">If the button doesn't work, copy and paste this link:</p>
              <p style="color: #a3a3a3; font-size: 11px; margin: 0; word-break: break-all;">${resetUrl}</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
            <p style="color: #525252; font-size: 11px; line-height: 1.5; margin: 0;">
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>
        </div>
      </div>
    `,
  });

  if (error) {
    log.error({ err: error }, "Failed to send password reset email");
    throw new Error("Failed to send password reset email");
  }

  log.info(
    { to, emailId: data?.id },
    "Password reset email accepted by Resend",
  );
}
