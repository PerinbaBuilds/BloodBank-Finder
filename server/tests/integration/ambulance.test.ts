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

async function createHospitalWithOpenRequest() {
  const hospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
  const created = await request(app)
    .post("/api/requests")
    .set(...authHeader(hospital.token))
    .send({ bloodGroup: "O-", unitsNeeded: 1, urgency: "CRITICAL" });
  return { hospital, requestId: created.body.request.id as string };
}

async function createAmbulanceFor(token: string) {
  const res = await request(app)
    .post("/api/ambulances")
    .set(...authHeader(token))
    .send({ vehicleNumber: "TN-09-AB-1234", driverName: "Ravi Kumar", driverPhone: "+91-9876543210" });
  return res.body;
}

describe("POST /api/ambulances (fleet management)", () => {
  it("lets a hospital register an ambulance to its own fleet", async () => {
    const hospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const res = await request(app)
      .post("/api/ambulances")
      .set(...authHeader(hospital.token))
      .send({ vehicleNumber: "TN-09-AB-1234", driverName: "Ravi Kumar", driverPhone: "+91-9876543210" });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("AVAILABLE");
    expect(res.body.lat).toBe(HQ.lat);
  });

  it("lets a blood bank register an ambulance to its own fleet", async () => {
    const bloodBank = await registerOrg(app, { type: "BLOOD_BANK", lat: HQ.lat, lng: HQ.lng });
    const res = await request(app)
      .post("/api/ambulances")
      .set(...authHeader(bloodBank.token))
      .send({ vehicleNumber: "TN-09-CD-5678", driverName: "Suresh", driverPhone: "+91-9876500001" });
    expect(res.status).toBe(201);
  });

  it("rejects ambulance creation from a donor account", async () => {
    const donor = await registerDonor(app);
    const res = await request(app)
      .post("/api/ambulances")
      .set(...authHeader(donor.token))
      .send({ vehicleNumber: "TN-09-AB-1234", driverName: "Ravi Kumar", driverPhone: "+91-9876543210" });
    expect(res.status).toBe(403);
  });
});

describe("GET /api/ambulances (fleet listing)", () => {
  it("only lists the requesting organization's own ambulances", async () => {
    const hospitalA = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const hospitalB = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    await createAmbulanceFor(hospitalA.token);
    await createAmbulanceFor(hospitalB.token);

    const res = await request(app).get("/api/ambulances").set(...authHeader(hospitalA.token));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe("PATCH /api/ambulances/:id (ownership)", () => {
  it("lets the owning organization update its own ambulance", async () => {
    const hospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const ambulance = await createAmbulanceFor(hospital.token);

    const res = await request(app)
      .patch(`/api/ambulances/${ambulance.id}`)
      .set(...authHeader(hospital.token))
      .send({ status: "OFFLINE" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OFFLINE");
  });

  it("forbids a different organization from updating someone else's ambulance", async () => {
    const hospitalA = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const hospitalB = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const ambulance = await createAmbulanceFor(hospitalA.token);

    const res = await request(app)
      .patch(`/api/ambulances/${ambulance.id}`)
      .set(...authHeader(hospitalB.token))
      .send({ status: "OFFLINE" });
    expect(res.status).toBe(403);
  });
});

describe("POST /api/ambulances/requests (dispatch)", () => {
  it("dispatches an ambulance request tied to the org's own emergency request", async () => {
    const { hospital, requestId } = await createHospitalWithOpenRequest();

    const res = await request(app)
      .post("/api/ambulances/requests")
      .set(...authHeader(hospital.token))
      .send({
        emergencyRequestId: requestId,
        pickupAddress: "12 Donor Lane, Chennai",
        pickupLat: 13.09,
        pickupLng: 80.28,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("REQUESTED");
    expect(res.body.dropoffAddress).toBeTypeOf("string");
  });

  it("immediately assigns and marks the ambulance ON_TRIP when an available ambulance is given upfront", async () => {
    const { hospital, requestId } = await createHospitalWithOpenRequest();
    const ambulance = await createAmbulanceFor(hospital.token);

    const res = await request(app)
      .post("/api/ambulances/requests")
      .set(...authHeader(hospital.token))
      .send({
        emergencyRequestId: requestId,
        ambulanceId: ambulance.id,
        pickupAddress: "12 Donor Lane, Chennai",
        pickupLat: 13.09,
        pickupLng: 80.28,
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("ASSIGNED");

    const updatedAmbulance = await prisma.ambulance.findUnique({ where: { id: ambulance.id } });
    expect(updatedAmbulance?.status).toBe("ON_TRIP");
  });

  it("notifies the linked donor when a response id is provided", async () => {
    const { hospital, requestId } = await createHospitalWithOpenRequest();
    const donor = await registerDonor(app, { bloodGroup: "O-", lat: 13.09, lng: 80.28 });
    const offer = await request(app)
      .post(`/api/requests/${requestId}/responses`)
      .set(...authHeader(donor.token));

    const res = await request(app)
      .post("/api/ambulances/requests")
      .set(...authHeader(hospital.token))
      .send({
        emergencyRequestId: requestId,
        responseId: offer.body.id,
        pickupAddress: "Donor pickup point",
        pickupLat: 13.09,
        pickupLng: 80.28,
      });
    expect(res.status).toBe(201);

    const notifications = await prisma.notification.findMany({ where: { userId: donor.body.user.id } });
    expect(notifications.some((n) => n.type === "AMBULANCE_DISPATCHED")).toBe(true);
  });

  it("rejects dispatching an ambulance request for another organization's emergency request", async () => {
    const { requestId } = await createHospitalWithOpenRequest();
    const otherHospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });

    const res = await request(app)
      .post("/api/ambulances/requests")
      .set(...authHeader(otherHospital.token))
      .send({
        emergencyRequestId: requestId,
        pickupAddress: "12 Donor Lane, Chennai",
        pickupLat: 13.09,
        pickupLng: 80.28,
      });
    expect(res.status).toBe(403);
  });

  it("rejects assigning an ambulance that is not AVAILABLE", async () => {
    const { hospital, requestId } = await createHospitalWithOpenRequest();
    const ambulance = await createAmbulanceFor(hospital.token);
    await request(app)
      .patch(`/api/ambulances/${ambulance.id}`)
      .set(...authHeader(hospital.token))
      .send({ status: "ON_TRIP" });

    const res = await request(app)
      .post("/api/ambulances/requests")
      .set(...authHeader(hospital.token))
      .send({
        emergencyRequestId: requestId,
        ambulanceId: ambulance.id,
        pickupAddress: "12 Donor Lane, Chennai",
        pickupLat: 13.09,
        pickupLng: 80.28,
      });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/ambulances/requests/:id (visibility)", () => {
  it("lets the owning organization and the linked donor view the dispatch", async () => {
    const { hospital, requestId } = await createHospitalWithOpenRequest();
    const donor = await registerDonor(app, { bloodGroup: "O-", lat: 13.09, lng: 80.28 });
    const offer = await request(app)
      .post(`/api/requests/${requestId}/responses`)
      .set(...authHeader(donor.token));
    const dispatch = await request(app)
      .post("/api/ambulances/requests")
      .set(...authHeader(hospital.token))
      .send({
        emergencyRequestId: requestId,
        responseId: offer.body.id,
        pickupAddress: "Donor pickup point",
        pickupLat: 13.09,
        pickupLng: 80.28,
      });

    const asOrg = await request(app)
      .get(`/api/ambulances/requests/${dispatch.body.id}`)
      .set(...authHeader(hospital.token));
    expect(asOrg.status).toBe(200);

    const asDonor = await request(app)
      .get(`/api/ambulances/requests/${dispatch.body.id}`)
      .set(...authHeader(donor.token));
    expect(asDonor.status).toBe(200);
  });

  it("forbids an unrelated donor from viewing the dispatch", async () => {
    const { hospital, requestId } = await createHospitalWithOpenRequest();
    const unrelatedDonor = await registerDonor(app);
    const dispatch = await request(app)
      .post("/api/ambulances/requests")
      .set(...authHeader(hospital.token))
      .send({
        emergencyRequestId: requestId,
        pickupAddress: "Donor pickup point",
        pickupLat: 13.09,
        pickupLng: 80.28,
      });

    const res = await request(app)
      .get(`/api/ambulances/requests/${dispatch.body.id}`)
      .set(...authHeader(unrelatedDonor.token));
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/ambulances/requests/:id (status lifecycle)", () => {
  it("walks a dispatch through ASSIGNED -> EN_ROUTE -> ARRIVED -> COMPLETED and frees the ambulance", async () => {
    const { hospital, requestId } = await createHospitalWithOpenRequest();
    const ambulance = await createAmbulanceFor(hospital.token);
    const dispatch = await request(app)
      .post("/api/ambulances/requests")
      .set(...authHeader(hospital.token))
      .send({
        emergencyRequestId: requestId,
        ambulanceId: ambulance.id,
        pickupAddress: "Donor pickup point",
        pickupLat: 13.09,
        pickupLng: 80.28,
      });

    for (const status of ["EN_ROUTE", "ARRIVED", "COMPLETED"]) {
      const res = await request(app)
        .patch(`/api/ambulances/requests/${dispatch.body.id}`)
        .set(...authHeader(hospital.token))
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }

    const freedAmbulance = await prisma.ambulance.findUnique({ where: { id: ambulance.id } });
    expect(freedAmbulance?.status).toBe("AVAILABLE");
  });

  it("rejects further updates once a dispatch is in a terminal state", async () => {
    const { hospital, requestId } = await createHospitalWithOpenRequest();
    const dispatch = await request(app)
      .post("/api/ambulances/requests")
      .set(...authHeader(hospital.token))
      .send({
        emergencyRequestId: requestId,
        pickupAddress: "Donor pickup point",
        pickupLat: 13.09,
        pickupLng: 80.28,
      });
    await request(app)
      .patch(`/api/ambulances/requests/${dispatch.body.id}`)
      .set(...authHeader(hospital.token))
      .send({ status: "CANCELLED" });

    const res = await request(app)
      .patch(`/api/ambulances/requests/${dispatch.body.id}`)
      .set(...authHeader(hospital.token))
      .send({ status: "ASSIGNED" });
    expect(res.status).toBe(400);
  });

  it("forbids a different organization from updating someone else's dispatch", async () => {
    const { hospital, requestId } = await createHospitalWithOpenRequest();
    const otherHospital = await registerOrg(app, { type: "HOSPITAL", lat: HQ.lat, lng: HQ.lng });
    const dispatch = await request(app)
      .post("/api/ambulances/requests")
      .set(...authHeader(hospital.token))
      .send({
        emergencyRequestId: requestId,
        pickupAddress: "Donor pickup point",
        pickupLat: 13.09,
        pickupLng: 80.28,
      });

    const res = await request(app)
      .patch(`/api/ambulances/requests/${dispatch.body.id}`)
      .set(...authHeader(otherHospital.token))
      .send({ status: "ASSIGNED" });
    expect(res.status).toBe(403);
  });
});
