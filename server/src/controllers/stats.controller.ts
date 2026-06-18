import { Request, Response } from "express";
import { prisma } from "@/config/prisma";

export async function overview(_req: Request, res: Response) {
  const [donorCount, bloodBankCount, hospitalCount, activeRequests, totalUnitsFulfilled, totalDonations] =
    await Promise.all([
      prisma.donorProfile.count(),
      prisma.organization.count({ where: { type: "BLOOD_BANK", isVerified: true } }),
      prisma.organization.count({ where: { type: "HOSPITAL", isVerified: true } }),
      prisma.emergencyRequest.count({ where: { status: { in: ["OPEN", "PARTIALLY_FULFILLED"] } } }),
      prisma.emergencyRequest.aggregate({ _sum: { unitsFulfilled: true } }),
      prisma.donorProfile.aggregate({ _sum: { totalDonations: true } }),
    ]);

  res.json({
    donorCount,
    bloodBankCount,
    hospitalCount,
    activeRequests,
    unitsFulfilled: totalUnitsFulfilled._sum.unitsFulfilled ?? 0,
    totalDonations: totalDonations._sum.totalDonations ?? 0,
  });
}
