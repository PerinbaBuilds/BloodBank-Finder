import { Role, Urgency } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { findCompatibleDonors } from "@/services/matching.service";
import { notifyUser, notifyUsers } from "@/services/notification.service";
import { getIO } from "@/sockets";
import { serializeRequest, serializeResponse } from "@/services/serializers";
import { CreateRequestInput, ListRequestsInput, UpdateRequestInput } from "@/schemas/request.schema";
import { BLOOD_GROUP_LABELS, isDonorCompatible } from "@/utils/blood";
import { haversineDistanceKm, roundKm } from "@/utils/distance";
import { checkDonationEligibility } from "@/utils/eligibility";

const URGENCY_RANK: Record<Urgency, number> = { CRITICAL: 0, HIGH: 1, MODERATE: 2 };

export async function createRequest(organizationId: string, input: CreateRequestInput) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw AppError.notFound("Organization not found");

  const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000);

  const request = await prisma.emergencyRequest.create({
    data: {
      organizationId,
      bloodGroup: input.bloodGroup,
      unitsNeeded: input.unitsNeeded,
      urgency: input.urgency,
      patientInfo: input.patientInfo,
      notes: input.notes,
      lat: input.lat ?? org.lat,
      lng: input.lng ?? org.lng,
      address: input.address ?? org.address,
      expiresAt,
    },
    include: { organization: true },
  });

  const matches = await findCompatibleDonors({
    bloodGroup: request.bloodGroup,
    lat: request.lat,
    lng: request.lng,
  });

  const payload = serializeRequest(request);

  if (matches.length > 0) {
    await notifyUsers(
      matches.map((m) => m.donor.userId),
      {
        type: "EMERGENCY_REQUEST",
        title: `${request.urgency} need: ${BLOOD_GROUP_LABELS[request.bloodGroup]} blood near you`,
        body: `${org.name} needs ${request.unitsNeeded} unit(s) of ${BLOOD_GROUP_LABELS[request.bloodGroup]} blood near ${request.address}.`,
        data: { requestId: request.id },
      }
    );

    const io = getIO();
    if (io) {
      for (const match of matches) {
        io.to(`user:${match.donor.userId}`).emit("request:new", {
          ...payload,
          distanceKm: match.distanceKm,
        });
      }
    }
  }

  return { request: payload, matchedDonorCount: matches.length };
}

export async function listRequests(params: { userId: string; role: Role; filters: ListRequestsInput }) {
  const { filters, userId, role } = params;

  if (filters.mine) {
    if (role !== "HOSPITAL" && role !== "BLOOD_BANK") {
      throw AppError.forbidden("Only organizations can view their own requests");
    }
    const org = await prisma.organization.findUnique({ where: { userId } });
    if (!org) throw AppError.notFound("Organization profile not found");

    const requests = await prisma.emergencyRequest.findMany({
      where: { organizationId: org.id, ...(filters.status ? { status: filters.status } : {}) },
      include: { organization: true, responses: true },
      orderBy: { createdAt: "desc" },
    });
    return requests.map(serializeRequest);
  }

  const requests = await prisma.emergencyRequest.findMany({
    where: {
      status: filters.status ?? "OPEN",
      ...(filters.bloodGroup ? { bloodGroup: filters.bloodGroup } : {}),
    },
    include: { organization: true, responses: true },
    take: 200,
  });

  let withDistance = requests.map((request) => ({
    request,
    distanceKm:
      filters.lat !== undefined && filters.lng !== undefined
        ? roundKm(haversineDistanceKm(filters.lat, filters.lng, request.lat, request.lng))
        : undefined,
  }));

  if (filters.lat !== undefined && filters.lng !== undefined) {
    withDistance = withDistance.filter((r) => (r.distanceKm ?? 0) <= filters.radiusKm);
  }

  if (filters.compatibleWithDonorBloodGroup) {
    withDistance = withDistance.filter((r) =>
      isDonorCompatible(filters.compatibleWithDonorBloodGroup!, r.request.bloodGroup)
    );
  }

  withDistance.sort((a, b) => {
    const urgencyDiff = URGENCY_RANK[a.request.urgency] - URGENCY_RANK[b.request.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    if (a.distanceKm !== undefined && b.distanceKm !== undefined) return a.distanceKm - b.distanceKm;
    return b.request.createdAt.getTime() - a.request.createdAt.getTime();
  });

  return withDistance.map(({ request, distanceKm }) => ({ ...serializeRequest(request), distanceKm }));
}

export async function getRequestById(requestId: string, actorUserId?: string) {
  const request = await prisma.emergencyRequest.findUnique({
    where: { id: requestId },
    include: {
      organization: true,
      responses: { include: { donor: { include: { donorProfile: true } } } },
    },
  });
  if (!request) throw AppError.notFound("Request not found");

  // The responder list (names, blood groups, distances) is private. Only the
  // owning organization sees everyone who offered; a donor sees just their own
  // response; anyone else sees none.
  const isOwner = request.organization.userId === actorUserId;
  const visibleResponses = isOwner
    ? request.responses
    : request.responses.filter((r) => r.donorUserId === actorUserId);

  return {
    ...serializeRequest(request),
    responses: visibleResponses.map(serializeResponse),
  };
}

export async function updateRequest(
  requestId: string,
  organizationId: string,
  input: UpdateRequestInput
) {
  const request = await prisma.emergencyRequest.findUnique({ where: { id: requestId } });
  if (!request) throw AppError.notFound("Request not found");
  if (request.organizationId !== organizationId) {
    throw AppError.forbidden("You do not own this request");
  }

  const updated = await prisma.emergencyRequest.update({
    where: { id: requestId },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.unitsFulfilled !== undefined ? { unitsFulfilled: input.unitsFulfilled } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
    include: { organization: true, responses: true },
  });

  const io = getIO();
  if (io) {
    for (const response of updated.responses) {
      io.to(`user:${response.donorUserId}`).emit("request:updated", serializeRequest(updated));
    }
  }

  return serializeRequest(updated);
}

export async function respondToRequest(requestId: string, donorUserId: string) {
  const request = await prisma.emergencyRequest.findUnique({ where: { id: requestId } });
  if (!request) throw AppError.notFound("Request not found");
  if (request.status === "FULFILLED" || request.status === "CANCELLED" || request.status === "EXPIRED") {
    throw AppError.badRequest("This request is no longer accepting responses");
  }

  const donorProfile = await prisma.donorProfile.findUnique({ where: { userId: donorUserId } });
  if (!donorProfile) throw AppError.forbidden("Only donors can respond to requests");
  if (!isDonorCompatible(donorProfile.bloodGroup, request.bloodGroup)) {
    throw AppError.badRequest("Your blood type is not compatible with this request");
  }
  const eligibility = checkDonationEligibility(donorProfile.lastDonationDate);
  if (!eligibility.isEligible) {
    throw AppError.badRequest(eligibility.reason ?? "You are not currently eligible to donate");
  }

  const existing = await prisma.requestResponse.findUnique({
    where: { requestId_donorUserId: { requestId, donorUserId } },
  });
  if (existing) throw AppError.conflict("You have already responded to this request");

  const distanceKm = roundKm(haversineDistanceKm(request.lat, request.lng, donorProfile.lat, donorProfile.lng));

  const response = await prisma.requestResponse.create({
    data: { requestId, donorUserId, distanceKm },
    include: { donor: { include: { donorProfile: true } } },
  });

  const org = await prisma.organization.findUnique({ where: { id: request.organizationId } });
  if (org) {
    await notifyUser(org.userId, {
      type: "DONOR_RESPONSE",
      title: "A donor offered to help",
      body: `${donorProfile.fullName} (${BLOOD_GROUP_LABELS[donorProfile.bloodGroup]}) offered to donate for your request, ~${distanceKm}km away.`,
      data: { requestId },
    });
    getIO()?.to(`user:${org.userId}`).emit("response:new", serializeResponse(response));
  }

  return serializeResponse(response);
}

export async function updateResponse(
  requestId: string,
  responseId: string,
  actorUserId: string,
  status: "CONFIRMED" | "COMPLETED" | "DECLINED" | "CANCELLED"
) {
  const response = await prisma.requestResponse.findUnique({
    where: { id: responseId },
    include: { request: { include: { organization: true } } },
  });
  if (!response || response.requestId !== requestId) throw AppError.notFound("Response not found");

  const isOwningOrg = response.request.organization.userId === actorUserId;
  const isRespondingDonor = response.donorUserId === actorUserId;
  if (!isOwningOrg && !isRespondingDonor) throw AppError.forbidden();

  // Confirming, declining, and marking a donation completed are all decisions
  // that belong to the requesting organization — a donor must not be able to
  // self-complete their own offer (which would inflate their donation count and
  // the request's fulfilled units without any hospital confirmation).
  if ((status === "CONFIRMED" || status === "DECLINED" || status === "COMPLETED") && !isOwningOrg) {
    throw AppError.forbidden("Only the requesting organization can confirm, decline, or complete an offer");
  }
  if (status === "CANCELLED" && !isRespondingDonor) {
    throw AppError.forbidden("Only the donor can cancel their own offer");
  }
  // A completion may only advance a currently-confirmed offer. This enforces the
  // state machine and makes the transition idempotent: replaying COMPLETED on an
  // already-completed (or unconfirmed) response is rejected instead of
  // re-incrementing the donation counters.
  if (status === "COMPLETED" && response.status !== "CONFIRMED") {
    throw AppError.badRequest("Only a confirmed offer can be marked as completed");
  }

  const responseInclude = { donor: { include: { donorProfile: true } } } as const;
  // Once this completion meets the units needed, close the request (FULFILLED)
  // so it stops showing to other donors browsing open requests. A request that
  // still needs more units stays OPEN so donors keep seeing it.
  const fullyFulfilled = response.request.unitsFulfilled + 1 >= response.request.unitsNeeded;
  const updated =
    status === "COMPLETED"
      ? (
          await prisma.$transaction([
            prisma.requestResponse.update({ where: { id: responseId }, data: { status }, include: responseInclude }),
            prisma.donorProfile.update({
              where: { userId: response.donorUserId },
              data: { lastDonationDate: new Date(), totalDonations: { increment: 1 } },
            }),
            prisma.emergencyRequest.update({
              where: { id: requestId },
              data: {
                unitsFulfilled: { increment: 1 },
                ...(fullyFulfilled ? { status: "FULFILLED" as const } : {}),
              },
            }),
          ])
        )[0]
      : await prisma.requestResponse.update({ where: { id: responseId }, data: { status }, include: responseInclude });

  const notifyTargetUserId = isOwningOrg ? response.donorUserId : response.request.organization.userId;
  await notifyUser(notifyTargetUserId, {
    type: "RESPONSE_UPDATED",
    title: "Donation offer updated",
    body: `Status changed to ${status}.`,
    data: { requestId, responseId },
  });
  getIO()?.to(`user:${notifyTargetUserId}`).emit("response:updated", serializeResponse(updated));

  return serializeResponse(updated);
}
