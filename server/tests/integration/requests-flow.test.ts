import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../helpers/app";
import { cleanDatabase, prisma } from "../helpers/db";
import { authHeader, donorPayload, registerDonor, registerOrg } from "../helpers/factories";

const HQ = { lat: 13.0827, lng: 80.2707 }; // hospital location used throughout

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/requests (matching pipeline)", () => {
  it("counts only donors who are compatible, available, eligible, and within radius", async () => {
    const hospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });

    // Compatible with an A+ patient, available, never donated, ~4.6km away -> MATCH
    await registerDonor(app, { bloodGroup: "A+", lat: 13.1127, lng: 80.3007 });
    // Different compatible group (O-), available, never donated, ~3.1km away -> MATCH
    await registerDonor(app, { bloodGroup: "O-", lat: 13.1027, lng: 80.2507 });
    // Incompatible group for an A+ patient -> NO MATCH
    await registerDonor(app, { bloodGroup: "B+", lat: 13.1127, lng: 80.3007 });
    // Compatible but marked unavailable -> NO MATCH
    const unavailable = await registerDonor(app, { bloodGroup: "A+", lat: 13.1127, lng: 80.3007 });
    await prisma.donorProfile.update({
      where: { userId: unavailable.body.user.id },
      data: { isAvailable: false },
    });
    // Compatible but donated 10 days ago (< 90 day minimum interval) -> NO MATCH
    const recentDonor = await registerDonor(app, { bloodGroup: "A+", lat: 13.1127, lng: 80.3007 });
    await prisma.donorProfile.update({
      where: { userId: recentDonor.body.user.id },
      data: { lastDonationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
    });
    // Compatible, available, eligible, but far away (~1768km, outside 15km default radius) -> NO MATCH
    await registerDonor(app, { bloodGroup: "A+", lat: 28.7041, lng: 77.1025 });

    const res = await request(app)
      .post("/api/requests")
      .set(...authHeader(hospital.token))
      .send({
        bloodGroup: "A+",
        unitsNeeded: 2,
        urgency: "CRITICAL",
        patientInfo: "Test patient",
      });

    expect(res.status).toBe(201);
    expect(res.body.matchedDonorCount).toBe(2);
    expect(res.body.request.bloodGroup).toBe("A+");
    expect(res.body.request.status).toBe("OPEN");
  });

  it("notifies every matched donor", async () => {
    const hospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const donor = await registerDonor(app, { bloodGroup: "O-", lat: 13.09, lng: 80.28 });

    await request(app)
      .post("/api/requests")
      .set(...authHeader(hospital.token))
      .send({ bloodGroup: "O-", unitsNeeded: 1, urgency: "HIGH" });

    const notifications = await prisma.notification.findMany({ where: { userId: donor.body.user.id } });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe("EMERGENCY_REQUEST");
  });

  it("rejects request creation from a donor account", async () => {
    const donor = await registerDonor(app);
    const res = await request(app)
      .post("/api/requests")
      .set(...authHeader(donor.token))
      .send({ bloodGroup: "O-", unitsNeeded: 1, urgency: "HIGH" });
    expect(res.status).toBe(403);
  });

  it("rejects unauthenticated request creation", async () => {
    const res = await request(app)
      .post("/api/requests")
      .send({ bloodGroup: "O-", unitsNeeded: 1, urgency: "HIGH" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/requests (listing)", () => {
  it("sorts CRITICAL above MODERATE regardless of creation order", async () => {
    const hospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const donor = await registerDonor(app);

    await request(app)
      .post("/api/requests")
      .set(...authHeader(hospital.token))
      .send({ bloodGroup: "O-", unitsNeeded: 1, urgency: "MODERATE" });
    await request(app)
      .post("/api/requests")
      .set(...authHeader(hospital.token))
      .send({ bloodGroup: "O-", unitsNeeded: 1, urgency: "CRITICAL" });

    const res = await request(app).get("/api/requests").set(...authHeader(donor.token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].urgency).toBe("CRITICAL");
    expect(res.body[1].urgency).toBe("MODERATE");
  });

  it("filters to only requests compatible with a given donor blood group", async () => {
    const hospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const donor = await registerDonor(app);

    // An A+ donor can give to AB+ (DONOR_CAN_GIVE_TO.A_POS includes AB_POS) -> should match
    await request(app)
      .post("/api/requests")
      .set(...authHeader(hospital.token))
      .send({ bloodGroup: "AB+", unitsNeeded: 1, urgency: "HIGH" });
    // An A+ donor cannot give to a B+ patient -> should be excluded
    await request(app)
      .post("/api/requests")
      .set(...authHeader(hospital.token))
      .send({ bloodGroup: "B+", unitsNeeded: 1, urgency: "HIGH" });

    const res = await request(app)
      .get("/api/requests")
      .query({ compatibleWithDonorBloodGroup: "A+" })
      .set(...authHeader(donor.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].bloodGroup).toBe("AB+");
  });

  it("rejects listing without authentication", async () => {
    const res = await request(app).get("/api/requests");
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/requests/:id (ownership)", () => {
  it("lets the owning hospital update its own request", async () => {
    const hospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const created = await request(app)
      .post("/api/requests")
      .set(...authHeader(hospital.token))
      .send({ bloodGroup: "O-", unitsNeeded: 1, urgency: "HIGH" });

    const res = await request(app)
      .patch(`/api/requests/${created.body.request.id}`)
      .set(...authHeader(hospital.token))
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(200);
    expect(res.body.notes).toBe("Updated notes");
  });

  it("forbids a different organization from updating someone else's request", async () => {
    const hospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const otherHospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const created = await request(app)
      .post("/api/requests")
      .set(...authHeader(hospital.token))
      .send({ bloodGroup: "O-", unitsNeeded: 1, urgency: "HIGH" });

    const res = await request(app)
      .patch(`/api/requests/${created.body.request.id}`)
      .set(...authHeader(otherHospital.token))
      .send({ notes: "Hijacked" });

    expect(res.status).toBe(403);
  });
});

describe("POST /api/requests/:id/responses (donor offers)", () => {
  async function createOpenRequest(bloodGroup: string) {
    const hospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const created = await request(app)
      .post("/api/requests")
      .set(...authHeader(hospital.token))
      .send({ bloodGroup, unitsNeeded: 1, urgency: "CRITICAL" });
    return { hospital, requestId: created.body.request.id as string };
  }

  it("lets a compatible, eligible donor respond", async () => {
    const { requestId } = await createOpenRequest("O-");
    const donor = await registerDonor(app, { bloodGroup: "O-", lat: 13.09, lng: 80.28 });

    const res = await request(app)
      .post(`/api/requests/${requestId}/responses`)
      .set(...authHeader(donor.token));

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("OFFERED");
    expect(res.body.distanceKm).toBeGreaterThan(0);
  });

  it("rejects a response from an incompatible donor", async () => {
    const { requestId } = await createOpenRequest("O-");
    const donor = await registerDonor(app, { bloodGroup: "B+" });

    const res = await request(app)
      .post(`/api/requests/${requestId}/responses`)
      .set(...authHeader(donor.token));

    expect(res.status).toBe(400);
  });

  it("rejects a duplicate response from the same donor", async () => {
    const { requestId } = await createOpenRequest("O-");
    const donor = await registerDonor(app, { bloodGroup: "O-" });

    const first = await request(app)
      .post(`/api/requests/${requestId}/responses`)
      .set(...authHeader(donor.token));
    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/api/requests/${requestId}/responses`)
      .set(...authHeader(donor.token));
    expect(second.status).toBe(409);
  });

  it("rejects a response from an ineligible donor (donated recently)", async () => {
    const { requestId } = await createOpenRequest("O-");
    const donor = await registerDonor(app, { bloodGroup: "O-" });
    await prisma.donorProfile.update({
      where: { userId: donor.body.user.id },
      data: { lastDonationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    });

    const res = await request(app)
      .post(`/api/requests/${requestId}/responses`)
      .set(...authHeader(donor.token));

    expect(res.status).toBe(400);
  });

  it("rejects a response from a non-donor account", async () => {
    const { requestId } = await createOpenRequest("O-");
    const otherOrg = await registerOrg(app, { type: "HOSPITAL" });

    const res = await request(app)
      .post(`/api/requests/${requestId}/responses`)
      .set(...authHeader(otherOrg.token));

    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/requests/:id/responses/:responseId (status transitions)", () => {
  async function setupOfferedResponse() {
    const hospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const donor = await registerDonor(app, { bloodGroup: "O-", lat: 13.09, lng: 80.28 });
    const created = await request(app)
      .post("/api/requests")
      .set(...authHeader(hospital.token))
      .send({ bloodGroup: "O-", unitsNeeded: 1, urgency: "CRITICAL" });
    const requestId = created.body.request.id as string;
    const offered = await request(app)
      .post(`/api/requests/${requestId}/responses`)
      .set(...authHeader(donor.token));
    return { hospital, donor, requestId, responseId: offered.body.id as string };
  }

  it("hides the donor's phone number until the offer is confirmed", async () => {
    const { hospital, requestId, responseId } = await setupOfferedResponse();

    const beforeConfirm = await request(app)
      .get(`/api/requests/${requestId}`)
      .set(...authHeader(hospital.token));
    expect(beforeConfirm.body.responses[0].donor.phone).toBeUndefined();

    const confirm = await request(app)
      .patch(`/api/requests/${requestId}/responses/${responseId}`)
      .set(...authHeader(hospital.token))
      .send({ status: "CONFIRMED" });
    expect(confirm.status).toBe(200);

    const afterConfirm = await request(app)
      .get(`/api/requests/${requestId}`)
      .set(...authHeader(hospital.token));
    expect(afterConfirm.body.responses[0].donor.phone).toBeTypeOf("string");
  });

  it("forbids the donor from confirming their own offer", async () => {
    const { donor, requestId, responseId } = await setupOfferedResponse();
    const res = await request(app)
      .patch(`/api/requests/${requestId}/responses/${responseId}`)
      .set(...authHeader(donor.token))
      .send({ status: "CONFIRMED" });
    expect(res.status).toBe(403);
  });

  it("forbids the organization from cancelling the donor's own offer", async () => {
    const { hospital, requestId, responseId } = await setupOfferedResponse();
    const res = await request(app)
      .patch(`/api/requests/${requestId}/responses/${responseId}`)
      .set(...authHeader(hospital.token))
      .send({ status: "CANCELLED" });
    expect(res.status).toBe(403);
  });

  it("lets the donor cancel their own offer", async () => {
    const { donor, requestId, responseId } = await setupOfferedResponse();
    const res = await request(app)
      .patch(`/api/requests/${requestId}/responses/${responseId}`)
      .set(...authHeader(donor.token))
      .send({ status: "CANCELLED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CANCELLED");
  });

  it("marking COMPLETED increments donor totalDonations and request unitsFulfilled", async () => {
    const { hospital, donor, requestId, responseId } = await setupOfferedResponse();

    await request(app)
      .patch(`/api/requests/${requestId}/responses/${responseId}`)
      .set(...authHeader(hospital.token))
      .send({ status: "CONFIRMED" });

    const res = await request(app)
      .patch(`/api/requests/${requestId}/responses/${responseId}`)
      .set(...authHeader(hospital.token))
      .send({ status: "COMPLETED" });
    expect(res.status).toBe(200);

    const donorProfile = await prisma.donorProfile.findUnique({ where: { userId: donor.body.user.id } });
    expect(donorProfile?.totalDonations).toBe(1);
    expect(donorProfile?.lastDonationDate).not.toBeNull();

    const updatedRequest = await prisma.emergencyRequest.findUnique({ where: { id: requestId } });
    expect(updatedRequest?.unitsFulfilled).toBe(1);
  });
});
