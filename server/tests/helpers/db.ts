import { prisma } from "@/config/prisma";

export { prisma };

export async function cleanDatabase() {
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.ambulanceRequest.deleteMany(),
    prisma.ambulance.deleteMany(),
    prisma.requestResponse.deleteMany(),
    prisma.emergencyRequest.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.donorProfile.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
