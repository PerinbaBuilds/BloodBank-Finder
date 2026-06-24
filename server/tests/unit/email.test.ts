import { describe, expect, it } from "vitest";
import { sendEmail } from "@/services/email.service";

describe("sendEmail", () => {
  it("resolves without throwing when RESEND_API_KEY is not configured", async () => {
    // .env.test intentionally omits RESEND_API_KEY so this exercises the no-op path
    await expect(
      sendEmail({ to: "donor@test.local", subject: "test", text: "test" })
    ).resolves.toBeUndefined();
  });
});
