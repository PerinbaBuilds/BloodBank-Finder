import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../helpers/app";
import { cleanDatabase, prisma } from "../helpers/db";
import { authHeader, donorPayload, orgPayload, registerDonor, registerOrg } from "../helpers/factories";

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/auth/register/donor", () => {
  it("creates a donor account and returns a usable token", async () => {
    const { body, token } = await registerDonor(app, { bloodGroup: "O-" });

    expect(token).toBeTypeOf("string");
    expect(body.user.role).toBe("DONOR");
    expect(body.donor.bloodGroup).toBe("O-");
    expect(body.donor.isAvailable).toBe(true);

    const me = await request(app).get("/api/auth/me").set(...authHeader(token));
    expect(me.status).toBe(200);
    expect(me.body.donor.fullName).toBe(body.donor.fullName);
  });

  it("stores height, last-donation date, and transfusion history", async () => {
    const payload = donorPayload({
      heightCm: 176,
      lastDonationDate: "2026-01-15",
      hadTransfusion: true,
      transfusionDate: "2024-06-10",
    });
    const res = await request(app).post("/api/auth/register/donor").send(payload);
    expect(res.status).toBe(201);
    expect(res.body.donor.heightCm).toBe(176);
    expect(res.body.donor.hadTransfusion).toBe(true);
    expect(res.body.donor.transfusionDate).not.toBeNull();
    expect(res.body.donor.lastDonationDate).not.toBeNull();
  });

  it("rejects a donor registration missing height", async () => {
    const { heightCm, ...noHeight } = donorPayload();
    void heightCm;
    const res = await request(app).post("/api/auth/register/donor").send(noHeight);
    expect(res.status).toBe(400);
  });

  it("rejects a second registration with the same email", async () => {
    const payload = donorPayload({ email: "dup@test.local" });
    const first = await request(app).post("/api/auth/register/donor").send(payload);
    expect(first.status).toBe(201);

    const second = await request(app).post("/api/auth/register/donor").send(payload);
    expect(second.status).toBe(409);
  });

  it("rejects an incomplete payload with a 400", async () => {
    const { fullName, ...incomplete } = donorPayload();
    const res = await request(app).post("/api/auth/register/donor").send(incomplete);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/register/organization", () => {
  it("creates an unverified hospital by default", async () => {
    const { body } = await registerOrg(app, { type: "HOSPITAL" });
    expect(body.user.role).toBe("HOSPITAL");
    expect(body.organization.type).toBe("HOSPITAL");
    expect(body.organization.isVerified).toBe(false);
  });

  it("creates an unverified blood bank by default", async () => {
    const { body } = await registerOrg(app, { type: "BLOOD_BANK" });
    expect(body.user.role).toBe("BLOOD_BANK");
    expect(body.organization.type).toBe("BLOOD_BANK");
    expect(body.organization.isVerified).toBe(false);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    const payload = orgPayload({ type: "HOSPITAL" });
    await request(app).post("/api/auth/register/organization").send(payload);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.organization.name).toBe(payload.name);
  });

  it("rejects a wrong password", async () => {
    const payload = orgPayload();
    await request(app).post("/api/auth/register/organization").send(payload);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: payload.email, password: "WrongPassword1!" });

    expect(res.status).toBe(401);
  });

  it("rejects an unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.local", password: "Password123!" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects requests with a malformed token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});

describe("role checks re-read the database instead of trusting the token", () => {
  it("revokes access immediately after a role downgrade, without requiring a new login", async () => {
    const { body, token } = await registerOrg(app, { type: "HOSPITAL" });

    await prisma.user.update({ where: { id: body.user.id }, data: { role: "DONOR" } });

    const res = await request(app)
      .post("/api/requests")
      .set(...authHeader(token))
      .send({ bloodGroup: "O-", unitsNeeded: 1, urgency: "HIGH" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("You do not have permission to perform this action");
  });

  it("grants access immediately after a role upgrade, without requiring a new login", async () => {
    const { body, token } = await registerDonor(app);

    await prisma.user.update({ where: { id: body.user.id }, data: { role: "ADMIN" } });

    const res = await request(app)
      .get("/api/admin/organizations")
      .set(...authHeader(token));

    expect(res.status).toBe(200);
  });
});
