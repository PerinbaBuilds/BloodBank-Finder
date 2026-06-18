import { Request, Response } from "express";
import * as inventoryService from "@/services/inventory.service";
import { validated } from "@/middleware/validate";
import { UpsertInventoryInput } from "@/schemas/inventory.schema";
import { serializeInventoryItem } from "@/services/serializers";

export async function getMine(req: Request, res: Response) {
  const items = await inventoryService.getInventory(req.userId!);
  res.json(items.map(serializeInventoryItem));
}

export async function upsertMine(req: Request, res: Response) {
  const input = validated<UpsertInventoryInput>(req);
  const items = await inventoryService.upsertInventory(req.userId!, input);
  res.json(items.map(serializeInventoryItem));
}
