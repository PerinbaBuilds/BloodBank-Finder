import { Request, Response } from "express";
import * as ambulanceService from "@/services/ambulance.service";
import { validated } from "@/middleware/validate";
import {
  CreateAmbulanceInput,
  CreateAmbulanceRequestInput,
  ListAmbulanceRequestsInput,
  UpdateAmbulanceInput,
  UpdateAmbulanceRequestInput,
} from "@/schemas/ambulance.schema";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { getParam } from "@/utils/params";

async function requireOrganizationId(userId: string): Promise<string> {
  const org = await prisma.organization.findUnique({ where: { userId } });
  if (!org) throw AppError.forbidden("Organization profile required");
  return org.id;
}

export async function createAmbulance(req: Request, res: Response) {
  const organizationId = await requireOrganizationId(req.userId!);
  const input = validated<CreateAmbulanceInput>(req);
  const result = await ambulanceService.createAmbulance(organizationId, input);
  res.status(201).json(result);
}

export async function listAmbulances(req: Request, res: Response) {
  const organizationId = await requireOrganizationId(req.userId!);
  const result = await ambulanceService.listAmbulances(organizationId);
  res.json(result);
}

export async function updateAmbulance(req: Request, res: Response) {
  const organizationId = await requireOrganizationId(req.userId!);
  const input = validated<UpdateAmbulanceInput>(req);
  const result = await ambulanceService.updateAmbulance(getParam(req, "id"), organizationId, input);
  res.json(result);
}

export async function createAmbulanceRequest(req: Request, res: Response) {
  const organizationId = await requireOrganizationId(req.userId!);
  const input = validated<CreateAmbulanceRequestInput>(req);
  const result = await ambulanceService.createAmbulanceRequest(organizationId, req.userId!, input);
  res.status(201).json(result);
}

export async function listAmbulanceRequests(req: Request, res: Response) {
  const organizationId = await requireOrganizationId(req.userId!);
  const filters = validated<ListAmbulanceRequestsInput>(req, "query");
  const result = await ambulanceService.listAmbulanceRequests(organizationId, filters);
  res.json(result);
}

export async function getAmbulanceRequest(req: Request, res: Response) {
  const result = await ambulanceService.getAmbulanceRequestById(getParam(req, "id"), req.userId!);
  res.json(result);
}

export async function updateAmbulanceRequest(req: Request, res: Response) {
  const organizationId = await requireOrganizationId(req.userId!);
  const input = validated<UpdateAmbulanceRequestInput>(req);
  const result = await ambulanceService.updateAmbulanceRequest(getParam(req, "id"), organizationId, input);
  res.json(result);
}
