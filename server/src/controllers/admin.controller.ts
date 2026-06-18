import { Request, Response } from "express";
import { prisma } from "@/config/prisma";
import { serializeOrganization } from "@/services/serializers";
import { notifyUser } from "@/services/notification.service";
import { getParam } from "@/utils/params";

export async function listOrganizations(req: Request, res: Response) {
  const verified = req.query.verified === undefined ? undefined : req.query.verified === "true";
  const orgs = await prisma.organization.findMany({
    where: verified === undefined ? {} : { isVerified: verified },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(orgs.map(serializeOrganization));
}

export async function verifyOrganization(req: Request, res: Response) {
  const org = await prisma.organization.update({
    where: { id: getParam(req, "id") },
    data: { isVerified: true },
    include: { user: true },
  });
  await notifyUser(org.userId, {
    type: "ORGANIZATION_VERIFIED",
    title: "Your organization is verified",
    body: `${org.name} has been verified and can now post emergency blood requests.`,
  });
  res.json(serializeOrganization(org));
}
