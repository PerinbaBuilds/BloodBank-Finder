import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../helpers/app";
import { cleanDatabase, prisma } from "../helpers/db";
import { authHeader, createAdmin, registerOrg } from "../helpers/factories";

const HQ = { lat: 13.0827, lng: 80.2707 };

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("inventory management", () => {
  it("lets a blood bank set and read its own inventory", async () => {
    const bloodBank = await registerOrg(app, { type: "BLOOD_BANK" });

    const put = await request(app)
      .put("/api/inventory/me")
      .set(...authHeader(bloodBank.token))
      .send({ items: [{ bloodGroup: "O-", units: 12 }, { bloodGroup: "A+", units: 5 }] });
    expect(put.status).toBe(200);

    const get = await request(app).get("/api/inventory/me").set(...authHeader(bloodBank.token));
    expect(get.status).toBe(200);
    const oNeg = get.body.find((i: any) => i.bloodGroup === "O-");
    expect(oNeg.units).toBe(12);
  });

  it("forbids a hospital from managing inventory", async () => {
    const hospital = await registerOrg(app, { type: "HOSPITAL" });
    const res = await request(app)
      .put("/api/inventory/me")
      .set(...authHeader(hospital.token))
      .send({ items: [{ bloodGroup: "O-", units: 1 }] });
    expect(res.status).toBe(403);
  });
});

describe("GET /api/organizations/search (public)", () => {
  it("excludes unverified blood banks even when stock and location match", async () => {
    const bloodBank = await registerOrg(app, { type: "BLOOD_BANK", lat: HQ.lat, lng: HQ.lng });
    await request(app)
      .put("/api/inventory/me")
      .set(...authHeader(bloodBank.token))
      .send({ items: [{ bloodGroup: "O-", units: 10 }] });

    const res = await request(app)
      .get("/api/organizations/search")
      .query({ bloodGroup: "O-", lat: HQ.lat, lng: HQ.lng, radiusKm: 50 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it("includes verified blood banks with matching stock within radius, excludes out-of-stock or out-of-range ones", async () => {
    const inStock = await registerOrg(app, { type: "BLOOD_BANK", lat: 13.09, lng: 80.28 });
    const outOfStock = await registerOrg(app, { type: "BLOOD_BANK", lat: 13.09, lng: 80.28 });
    const tooFar = await registerOrg(app, { type: "BLOOD_BANK", lat: 28.7041, lng: 77.1025 });

    await request(app)
      .put("/api/inventory/me")
      .set(...authHeader(inStock.token))
      .send({ items: [{ bloodGroup: "O-", units: 4 }] });
    await request(app)
      .put("/api/inventory/me")
      .set(...authHeader(outOfStock.token))
      .send({ items: [{ bloodGroup: "O-", units: 0 }] });
    await request(app)
      .put("/api/inventory/me")
      .set(...authHeader(tooFar.token))
      .send({ items: [{ bloodGroup: "O-", units: 9 }] });

    const admin = await createAdmin();
    for (const org of [inStock, outOfStock, tooFar]) {
      await request(app)
        .patch(`/api/admin/organizations/${org.body.organization.id}/verify`)
        .set(...authHeader(admin.token));
    }

    const res = await request(app)
      .get("/api/organizations/search")
      .query({ bloodGroup: "O-", lat: HQ.lat, lng: HQ.lng, radiusKm: 15 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(inStock.body.organization.id);
    expect(res.body[0].distanceKm).toBeGreaterThan(0);
  });
});

describe("admin organization management", () => {
  it("forbids non-admins from listing organizations", async () => {
    const hospital = await registerOrg(app, { type: "HOSPITAL" });
    const res = await request(app)
      .get("/api/admin/organizations")
      .set(...authHeader(hospital.token));
    expect(res.status).toBe(403);
  });

  it("lets an admin list and verify organizations", async () => {
    const hospital = await registerOrg(app, { type: "HOSPITAL" });
    const admin = await createAdmin();

    const list = await request(app)
      .get("/api/admin/organizations")
      .query({ verified: "false" })
      .set(...authHeader(admin.token));
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].isVerified).toBe(false);

    const verify = await request(app)
      .patch(`/api/admin/organizations/${hospital.body.organization.id}/verify`)
      .set(...authHeader(admin.token));
    expect(verify.status).toBe(200);
    expect(verify.body.isVerified).toBe(true);

    const notifications = await prisma.notification.findMany({ where: { userId: hospital.body.user.id } });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe("ORGANIZATION_VERIFIED");
  });
});

describe("GET /api/stats/overview (public)", () => {
  it("only counts verified blood banks and hospitals", async () => {
    const hospital = await registerOrg(app, { type: "HOSPITAL" });
    await registerOrg(app, { type: "BLOOD_BANK" }); // left unverified on purpose

    const beforeVerify = await request(app).get("/api/stats/overview");
    expect(beforeVerify.body.hospitalCount).toBe(0);
    expect(beforeVerify.body.bloodBankCount).toBe(0);

    const admin = await createAdmin();
    await request(app)
      .patch(`/api/admin/organizations/${hospital.body.organization.id}/verify`)
      .set(...authHeader(admin.token));

    const afterVerify = await request(app).get("/api/stats/overview");
    expect(afterVerify.body.hospitalCount).toBe(1);
    expect(afterVerify.body.bloodBankCount).toBe(0);
  });
});
