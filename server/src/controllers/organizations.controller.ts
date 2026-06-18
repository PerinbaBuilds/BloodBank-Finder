import { Request, Response } from "express";
import * as organizationsService from "@/services/organizations.service";
import { validated } from "@/middleware/validate";
import { SearchOrganizationsInput, UpdateOrganizationInput } from "@/schemas/organization.schema";
import { serializeInventoryItem, serializeOrganization } from "@/services/serializers";
import { getParam } from "@/utils/params";

export async function getMe(req: Request, res: Response) {
  const org = await organizationsService.getOrganizationByUserId(req.userId!);
  res.json(serializeOrganization(org));
}

export async function updateMe(req: Request, res: Response) {
  const input = validated<UpdateOrganizationInput>(req);
  const org = await organizationsService.updateOrganization(req.userId!, input);
  res.json(serializeOrganization(org));
}

export async function getById(req: Request, res: Response) {
  const org = await organizationsService.getOrganizationById(getParam(req, "id"));
  res.json({ ...serializeOrganization(org), inventory: org.inventory.map(serializeInventoryItem) });
}

export async function search(req: Request, res: Response) {
  const filters = validated<SearchOrganizationsInput>(req, "query");
  const results = await organizationsService.searchOrganizations(filters);
  res.json(
    results.map(({ organization, distanceKm }) => ({
      ...serializeOrganization(organization),
      inventory: organization.inventory.map(serializeInventoryItem),
      distanceKm,
    }))
  );
}
