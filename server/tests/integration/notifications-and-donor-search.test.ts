import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../helpers/app";
import { cleanDatabase, prisma } from "../helpers/db";
import { authHeader, registerDonor, registerOrg } from "../helpers/factories";

const HQ = { lat: 13.0827, lng: 80.2707 };

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("notifications", () => {
  async function triggerOneNotification() {
    const hospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const donor = await registerDonor(app, { bloodGroup: "O-", lat: 13.09, lng: 80.28 });
    await request(app)
      .post("/api/requests")
      .set(...authHeader(hospital.token))
      .send({ bloodGroup: "O-", unitsNeeded: 1, urgency: "CRITICAL" });
    return donor;
  }

  it("lists a donor's own notifications, newest first", async () => {
    const donor = await triggerOneNotification();
    const res = await request(app).get("/api/notifications").set(...authHeader(donor.token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].isRead).toBe(false);
  });

  it("marks a single notification read, scoped to its owner", async () => {
    const donor = await triggerOneNotification();
    const otherDonor = await registerDonor(app);
    const list = await request(app).get("/api/notifications").set(...authHeader(donor.token));
    const notificationId = list.body[0].id;

    const stolen = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set(...authHeader(otherDonor.token));
    expect(stolen.status).toBe(404);

    const ok = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set(...authHeader(donor.token));
    expect(ok.status).toBe(200);
    expect(ok.body.isRead).toBe(true);
  });

  it("marks all of a donor's notifications read", async () => {
    const donor = await triggerOneNotification();
    const res = await request(app)
      .patch("/api/notifications/read-all")
      .set(...authHeader(donor.token));
    expect(res.status).toBe(204);

    const remaining = await prisma.notification.findMany({ where: { userId: donor.body.user.id } });
    expect(remaining.every((n) => n.isRead)).toBe(true);
  });

  it("rejects unauthenticated access", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/donors/search", () => {
  it("lets a hospital find compatible, available, eligible donors nearby", async () => {
    const hospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    await registerDonor(app, { bloodGroup: "O-", lat: 13.09, lng: 80.28 });
    await registerDonor(app, { bloodGroup: "B+", lat: 13.09, lng: 80.28 }); // incompatible with A+ patient

    const res = await request(app)
      .get("/api/donors/search")
      .query({ bloodGroup: "A+", lat: HQ.lat, lng: HQ.lng, radiusKm: 15 })
      .set(...authHeader(hospital.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].bloodGroup).toBe("O-");
    expect(res.body[0].distanceKm).toBeGreaterThan(0);
  });

  it("returns an empty list when no blood group filter is given", async () => {
    const hospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const res = await request(app)
      .get("/api/donors/search")
      .query({ lat: HQ.lat, lng: HQ.lng })
      .set(...authHeader(hospital.token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("forbids a donor from using the org-only search endpoint", async () => {
    const donor = await registerDonor(app);
    const res = await request(app)
      .get("/api/donors/search")
      .query({ bloodGroup: "A+", lat: HQ.lat, lng: HQ.lng })
      .set(...authHeader(donor.token));
    expect(res.status).toBe(403);
  });
});
