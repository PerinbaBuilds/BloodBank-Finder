import { Prisma } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { notifyUser } from "@/services/notification.service";
import { getIO } from "@/sockets";
import { serializeAmbulance, serializeAmbulanceRequest } from "@/services/serializers";
import {
  CreateAmbulanceInput,
  CreateAmbulanceRequestInput,
  ListAmbulanceRequestsInput,
  UpdateAmbulanceInput,
  UpdateAmbulanceRequestInput,
} from "@/schemas/ambulance.schema";

const TERMINAL_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

export async function createAmbulance(organizationId: string, input: CreateAmbulanceInput) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw AppError.notFound("Organization not found");

  const ambulance = await prisma.ambulance.create({
    data: {
      organizationId,
      vehicleNumber: input.vehicleNumber,
      driverName: input.driverName,
      driverPhone: input.driverPhone,
      lat: input.lat ?? org.lat,
      lng: input.lng ?? org.lng,
    },
  });
  return serializeAmbulance(ambulance);
}

export async function listAmbulances(organizationId: string) {
  const ambulances = await prisma.ambulance.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
  return ambulances.map(serializeAmbulance);
}

export async function updateAmbulance(
  ambulanceId: string,
  organizationId: string,
  input: UpdateAmbulanceInput
) {
  const ambulance = await prisma.ambulance.findUnique({ where: { id: ambulanceId } });
  if (!ambulance) throw AppError.notFound("Ambulance not found");
  if (ambulance.organizationId !== organizationId) throw AppError.forbidden("You do not own this ambulance");

  const updated = await prisma.ambulance.update({
    where: { id: ambulanceId },
    data: {
      ...(input.driverName !== undefined ? { driverName: input.driverName } : {}),
      ...(input.driverPhone !== undefined ? { driverPhone: input.driverPhone } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.lat !== undefined ? { lat: input.lat } : {}),
      ...(input.lng !== undefined ? { lng: input.lng } : {}),
    },
  });
  return serializeAmbulance(updated);
}

export async function createAmbulanceRequest(
  organizationId: string,
  requestedByUserId: string,
  input: CreateAmbulanceRequestInput
) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw AppError.notFound("Organization not found");

  const emergencyRequest = await prisma.emergencyRequest.findUnique({
    where: { id: input.emergencyRequestId },
  });
  if (!emergencyRequest) throw AppError.notFound("Emergency request not found");
  if (emergencyRequest.organizationId !== organizationId) {
    throw AppError.forbidden("You do not own this emergency request");
  }

  let response = null;
  if (input.responseId) {
    response = await prisma.requestResponse.findUnique({ where: { id: input.responseId } });
    if (!response || response.requestId !== emergencyRequest.id) {
      throw AppError.notFound("Donor response not found for this request");
    }
  }

  let ambulance = null;
  if (input.ambulanceId) {
    ambulance = await prisma.ambulance.findUnique({ where: { id: input.ambulanceId } });
    if (!ambulance || ambulance.organizationId !== organizationId) {
      throw AppError.notFound("Ambulance not found");
    }
    if (ambulance.status !== "AVAILABLE") {
      throw AppError.badRequest("Ambulance is not available for dispatch");
    }
  }

  const ambulanceRequest = await prisma.$transaction(async (tx) => {
    const created = await tx.ambulanceRequest.create({
      data: {
        emergencyRequestId: emergencyRequest.id,
        responseId: input.responseId,
        organizationId,
        ambulanceId: input.ambulanceId,
        requestedByUserId,
        status: ambulance ? "ASSIGNED" : "REQUESTED",
        pickupAddress: input.pickupAddress,
        pickupLat: input.pickupLat,
        pickupLng: input.pickupLng,
        dropoffAddress: input.dropoffAddress ?? org.address,
        dropoffLat: input.dropoffLat ?? org.lat,
        dropoffLng: input.dropoffLng ?? org.lng,
        notes: input.notes,
      },
      include: { ambulance: true },
    });
    if (ambulance) {
      await tx.ambulance.update({ where: { id: ambulance.id }, data: { status: "ON_TRIP" } });
    }
    return created;
  });

  if (response) {
    await notifyUser(response.donorUserId, {
      type: "AMBULANCE_DISPATCHED",
      title: "Ambulance arranged for your donation",
      body: `${org.name} has arranged transportation to ${ambulanceRequest.dropoffAddress}.`,
      data: { ambulanceRequestId: ambulanceRequest.id, requestId: emergencyRequest.id },
    });
    getIO()?.to(`user:${response.donorUserId}`).emit("ambulance:updated", serializeAmbulanceRequest(ambulanceRequest));
  }

  return serializeAmbulanceRequest(ambulanceRequest);
}

export async function listAmbulanceRequests(organizationId: string, filters: ListAmbulanceRequestsInput) {
  const ambulanceRequests = await prisma.ambulanceRequest.findMany({
    where: {
      organizationId,
      ...(filters.status ? { status: filters.status } : {}),
    },
    include: { ambulance: true },
    orderBy: { createdAt: "desc" },
  });
  return ambulanceRequests.map(serializeAmbulanceRequest);
}

export async function getAmbulanceRequestById(ambulanceRequestId: string, actorUserId: string) {
  const ambulanceRequest = await prisma.ambulanceRequest.findUnique({
    where: { id: ambulanceRequestId },
    include: { ambulance: true, organization: true, response: true },
  });
  if (!ambulanceRequest) throw AppError.notFound("Ambulance request not found");

  const isOwningOrg = ambulanceRequest.organization.userId === actorUserId;
  const isLinkedDonor = ambulanceRequest.response?.donorUserId === actorUserId;
  if (!isOwningOrg && !isLinkedDonor) throw AppError.forbidden();

  return serializeAmbulanceRequest(ambulanceRequest);
}

export async function updateAmbulanceRequest(
  ambulanceRequestId: string,
  organizationId: string,
  input: UpdateAmbulanceRequestInput
) {
  const ambulanceRequest = await prisma.ambulanceRequest.findUnique({
    where: { id: ambulanceRequestId },
    include: { ambulance: true, response: true },
  });
  if (!ambulanceRequest) throw AppError.notFound("Ambulance request not found");
  if (ambulanceRequest.organizationId !== organizationId) {
    throw AppError.forbidden("You do not own this ambulance request");
  }
  if (TERMINAL_STATUSES.has(ambulanceRequest.status)) {
    throw AppError.badRequest("This ambulance request has already been completed or cancelled");
  }

  const ambulanceStatusUpdates: { id: string; status: "AVAILABLE" | "ON_TRIP" }[] = [];
  let nextAmbulanceId: string | undefined;
  let nextStatus = input.status;

  if (input.ambulanceId !== undefined && input.ambulanceId !== ambulanceRequest.ambulanceId) {
    const nextAmbulance = await prisma.ambulance.findUnique({ where: { id: input.ambulanceId } });
    if (!nextAmbulance || nextAmbulance.organizationId !== organizationId) {
      throw AppError.notFound("Ambulance not found");
    }
    if (nextAmbulance.status !== "AVAILABLE") {
      throw AppError.badRequest("Ambulance is not available for dispatch");
    }
    if (ambulanceRequest.ambulanceId) {
      ambulanceStatusUpdates.push({ id: ambulanceRequest.ambulanceId, status: "AVAILABLE" });
    }
    ambulanceStatusUpdates.push({ id: nextAmbulance.id, status: "ON_TRIP" });
    nextAmbulanceId = nextAmbulance.id;
    nextStatus = input.status ?? "ASSIGNED";
  }

  if (nextStatus && TERMINAL_STATUSES.has(nextStatus) && ambulanceRequest.ambulanceId) {
    if (!ambulanceStatusUpdates.some((u) => u.id === ambulanceRequest.ambulanceId)) {
      ambulanceStatusUpdates.push({ id: ambulanceRequest.ambulanceId, status: "AVAILABLE" });
    }
  }

  const updates: Prisma.AmbulanceRequestUpdateInput = {
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(nextAmbulanceId !== undefined ? { ambulanceId: nextAmbulanceId } : {}),
    ...(nextStatus !== undefined ? { status: nextStatus } : {}),
  };

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.ambulanceRequest.update({
      where: { id: ambulanceRequestId },
      data: updates,
      include: { ambulance: true },
    });
    for (const u of ambulanceStatusUpdates) {
      await tx.ambulance.update({ where: { id: u.id }, data: { status: u.status } });
    }
    return result;
  });

  if (ambulanceRequest.response) {
    await notifyUser(ambulanceRequest.response.donorUserId, {
      type: "AMBULANCE_UPDATED",
      title: "Ambulance status updated",
      body: `Your arranged transportation is now ${updated.status.replace("_", " ").toLowerCase()}.`,
      data: { ambulanceRequestId: updated.id },
    });
    getIO()?.to(`user:${ambulanceRequest.response.donorUserId}`).emit("ambulance:updated", serializeAmbulanceRequest(updated));
  }

  return serializeAmbulanceRequest(updated);
}
