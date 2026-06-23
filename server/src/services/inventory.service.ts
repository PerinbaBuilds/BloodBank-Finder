import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { UpsertInventoryInput } from "@/schemas/inventory.schema";
import { env } from "@/config/env";
import { notifyUser } from "@/services/notification.service";
import { BLOOD_GROUP_LABELS } from "@/utils/blood";

export async function getInventory(userId: string) {
  const org = await prisma.organization.findUnique({ where: { userId } });
  if (!org) throw AppError.notFound("Organization profile not found");
  if (org.type !== "BLOOD_BANK") throw AppError.forbidden("Only blood banks manage inventory");

  return prisma.inventoryItem.findMany({ where: { organizationId: org.id } });
}

export async function upsertInventory(userId: string, input: UpsertInventoryInput) {
  const org = await prisma.organization.findUnique({ where: { userId } });
  if (!org) throw AppError.notFound("Organization profile not found");
  if (org.type !== "BLOOD_BANK") throw AppError.forbidden("Only blood banks manage inventory");

  const updatedItems = await prisma.$transaction(
    input.items.map((item) =>
      prisma.inventoryItem.upsert({
        where: { organizationId_bloodGroup: { organizationId: org.id, bloodGroup: item.bloodGroup } },
        create: { organizationId: org.id, bloodGroup: item.bloodGroup, units: item.units },
        update: { units: item.units },
      })
    )
  );

  const lowStockItems = updatedItems.filter((item) => item.units <= env.LOW_STOCK_THRESHOLD);
  if (lowStockItems.length > 0) {
    const groups = lowStockItems.map((item) => `${BLOOD_GROUP_LABELS[item.bloodGroup]} (${item.units} units)`);
    await notifyUser(userId, {
      type: "LOW_STOCK_ALERT",
      title: "Low blood stock alert",
      body: `Stock running low for: ${groups.join(", ")}.`,
      data: { bloodGroups: lowStockItems.map((item) => item.bloodGroup) },
    });
  }

  return prisma.inventoryItem.findMany({ where: { organizationId: org.id } });
}
