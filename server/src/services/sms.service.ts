import twilio from "twilio";
import { env, isTest } from "@/config/env";

const client =
  env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
    ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
    : null;

/** Normalizes a stored phone number (e.g. "+91-9000000000") to the E.164 format Twilio requires. */
export function toE164(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export interface SendSmsInput {
  to: string;
  body: string;
}

/** Sends an SMS via Twilio. No-ops silently when Twilio env vars aren't configured; never throws. */
export async function sendSms(input: SendSmsInput): Promise<void> {
  if (!client || !env.TWILIO_PHONE_NUMBER) return;

  try {
    await client.messages.create({
      from: env.TWILIO_PHONE_NUMBER,
      to: toE164(input.to),
      body: input.body,
    });
  } catch (error) {
    if (!isTest) console.error("Failed to send SMS:", error);
  }
}
