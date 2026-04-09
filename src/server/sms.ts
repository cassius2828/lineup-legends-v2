import twilio from "twilio";
import { env } from "~/env";
import { logger } from "~/lib/logger";

const log = logger.child({ module: "sms" });

let _client: twilio.Twilio | null = null;
function getTwilioClient(): twilio.Twilio {
  return (_client ??= twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN));
}

export async function sendSmsCode({ to, code }: { to: string; code: string }) {
  try {
    await getTwilioClient().messages.create({
      body: `Your Lineup Legends verification code is: ${code}. It expires in 10 minutes.`,
      from: env.TWILIO_PHONE_NUMBER,
      to,
    });
  } catch (error) {
    log.error({ err: error, to }, "Failed to send SMS");
    throw new Error("Failed to send SMS verification code");
  }
}
