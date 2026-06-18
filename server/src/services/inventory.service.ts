import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { UpsertInventoryInput } from "@/schemas/inventory.schema";

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

  await prisma.$transaction(
    input.items.map((item) =>
      prisma.inventoryItem.upsert({
        where: { organizationId_bloodGroup: { organizationId: org.id, bloodGroup: item.bloodGroup } },
        create: { organizationId: org.id, bloodGroup: item.bloodGroup, units: item.units },
        update: { units: item.units },
      })
    )
  );

  return prisma.inventoryItem.findMany({ where: { organizationId: org.id } });
}
