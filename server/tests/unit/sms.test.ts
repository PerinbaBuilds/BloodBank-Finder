import { describe, expect, it } from "vitest";
import { sendSms, toE164 } from "@/services/sms.service";

describe("toE164", () => {
  it("strips hyphens from a stored phone number", () => {
    expect(toE164("+91-9000000000")).toBe("+919000000000");
  });

  it("strips spaces", () => {
    expect(toE164("+91 90000 00000")).toBe("+919000000000");
  });

  it("adds a leading + when missing", () => {
    expect(toE164("919000000000")).toBe("+919000000000");
  });

  it("is a no-op on an already-clean E.164 number", () => {
    expect(toE164("+919000000000")).toBe("+919000000000");
  });
});

describe("sendSms", () => {
  it("resolves without throwing when Twilio env vars are not configured", async () => {
    // .env.test intentionally omits TWILIO_* so this exercises the no-op path
    await expect(sendSms({ to: "+919000000000", body: "test" })).resolves.toBeUndefined();
  });
});
