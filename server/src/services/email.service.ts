import { Resend } from "resend";
import { env, isTest } from "@/config/env";

const client = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
}

/** Sends an email via Resend. No-ops silently when RESEND_API_KEY isn't configured; never throws. */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!client) return;

  try {
    await client.emails.send({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
  } catch (error) {
    if (!isTest) console.error("Failed to send email:", error);
  }
}
