import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

// Capture outbound emails so we can read the reset link/token the flow generates.
const { sentEmails } = vi.hoisted(() => ({ sentEmails: [] as { to: string; subject: string; text: string }[] }));
vi.mock("@/services/email.service", () => ({
  sendEmail: vi.fn(async (input: { to: string; subject: string; text: string }) => {
    sentEmails.push(input);
  }),
}));

import { app } from "../helpers/app";
import { cleanDatabase, prisma } from "../helpers/db";
import { donorPayload, orgPayload } from "../helpers/factories";

function tokenFromLastEmail(): string {
  const email = sentEmails.at(-1);
  const match = email?.text.match(/reset-password\?token=([a-f0-9]+)/);
  if (!match) throw new Error("No reset token found in email");
  return match[1];
}

beforeEach(async () => {
  await cleanDatabase();
  sentEmails.length = 0;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/auth/forgot-password", () => {
  it("emails a reset link and lets a donor set a new password", async () => {
    const payload = donorPayload({ email: "reset-donor@test.local" });
    await request(app).post("/api/auth/register/donor").send(payload);
    sentEmails.length = 0; // drop the welcome email so we only assert on the reset one

    const forgot = await request(app).post("/api/auth/forgot-password").send({ email: payload.email });
    expect(forgot.status).toBe(200);
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe(payload.email);

    const token = tokenFromLastEmail();
    const reset = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "BrandNewPass1!" });
    expect(reset.status).toBe(200);

    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: payload.email, password: payload.password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: payload.email, password: "BrandNewPass1!" });
    expect(newLogin.status).toBe(200);
  });

  it("also works for an organization (hospital / blood bank) account", async () => {
    const payload = orgPayload({ email: "reset-org@test.local", type: "BLOOD_BANK" });
    await request(app).post("/api/auth/register/organization").send(payload);
    sentEmails.length = 0;

    await request(app).post("/api/auth/forgot-password").send({ email: payload.email });
    const token = tokenFromLastEmail();

    const reset = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "OrgFreshPass1!" });
    expect(reset.status).toBe(200);

    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: payload.email, password: "OrgFreshPass1!" });
    expect(newLogin.status).toBe(200);
  });

  it("returns 200 without sending mail for an unknown email (no account enumeration)", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({ email: "nobody@test.local" });
    expect(res.status).toBe(200);
    expect(sentEmails).toHaveLength(0);
  });
});

describe("POST /api/auth/reset-password", () => {
  it("rejects an invalid token", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "not-a-real-token", password: "Whatever123!" });
    expect(res.status).toBe(400);
  });

  it("rejects an expired token", async () => {
    const payload = donorPayload({ email: "expired-donor@test.local" });
    await request(app).post("/api/auth/register/donor").send(payload);
    sentEmails.length = 0;
    await request(app).post("/api/auth/forgot-password").send({ email: payload.email });
    const token = tokenFromLastEmail();

    // Force the stored token to be expired.
    await prisma.user.update({
      where: { email: payload.email },
      data: { resetTokenExpiresAt: new Date(Date.now() - 1000) },
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "TooLate123!" });
    expect(res.status).toBe(400);
  });

  it("rejects a token that was already used", async () => {
    const payload = donorPayload({ email: "reuse-donor@test.local" });
    await request(app).post("/api/auth/register/donor").send(payload);
    sentEmails.length = 0;
    await request(app).post("/api/auth/forgot-password").send({ email: payload.email });
    const token = tokenFromLastEmail();

    const first = await request(app).post("/api/auth/reset-password").send({ token, password: "FirstUse123!" });
    expect(first.status).toBe(200);

    const second = await request(app).post("/api/auth/reset-password").send({ token, password: "SecondUse123!" });
    expect(second.status).toBe(400);
  });
});

describe("registration welcome email", () => {
  it("sends a welcome email to a new donor", async () => {
    const payload = donorPayload({ email: "welcome-donor@test.local" });
    await request(app).post("/api/auth/register/donor").send(payload);
    expect(sentEmails.some((e) => e.to === payload.email && /welcome/i.test(e.subject))).toBe(true);
  });

  it("sends a welcome email to a new organization", async () => {
    const payload = orgPayload({ email: "welcome-org@test.local" });
    await request(app).post("/api/auth/register/organization").send(payload);
    expect(sentEmails.some((e) => e.to === payload.email && /welcome/i.test(e.subject))).toBe(true);
  });
});
