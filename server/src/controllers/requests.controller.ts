import { Request, Response } from "express";
import * as requestsService from "@/services/requests.service";
import { validated } from "@/middleware/validate";
import { CreateRequestInput, ListRequestsInput, UpdateRequestInput, UpdateResponseInput } from "@/schemas/request.schema";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { getParam } from "@/utils/params";

async function requireOrganizationId(userId: string): Promise<string> {
  const org = await prisma.organization.findUnique({ where: { userId } });
  if (!org) throw AppError.forbidden("Organization profile required");
  return org.id;
}

export async function createRequest(req: Request, res: Response) {
  const organizationId = await requireOrganizationId(req.userId!);
  const input = validated<CreateRequestInput>(req);
  const result = await requestsService.createRequest(organizationId, input);
  res.status(201).json(result);
}

export async function listRequests(req: Request, res: Response) {
  const filters = validated<ListRequestsInput>(req, "query");
  const results = await requestsService.listRequests({
    userId: req.userId!,
    role: req.userRole!,
    filters,
  });
  res.json(results);
}

export async function getRequest(req: Request, res: Response) {
  const result = await requestsService.getRequestById(getParam(req, "id"), req.userId);
  res.json(result);
}

export async function updateRequest(req: Request, res: Response) {
  const organizationId = await requireOrganizationId(req.userId!);
  const input = validated<UpdateRequestInput>(req);
  const result = await requestsService.updateRequest(getParam(req, "id"), organizationId, input);
  res.json(result);
}

export async function respondToRequest(req: Request, res: Response) {
  const result = await requestsService.respondToRequest(getParam(req, "id"), req.userId!);
  res.status(201).json(result);
}

export async function updateResponse(req: Request, res: Response) {
  const { status } = validated<UpdateResponseInput>(req);
  const result = await requestsService.updateResponse(
    getParam(req, "id"),
    getParam(req, "responseId"),
    req.userId!,
    status
  );
  res.json(result);
}
