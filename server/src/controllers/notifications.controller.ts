import { Request, Response } from "express";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { getParam } from "@/utils/params";

export async function list(req: Request, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(notifications);
}

export async function markRead(req: Request, res: Response) {
  const id = getParam(req, "id");
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== req.userId) {
    throw AppError.notFound("Notification not found");
  }
  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
  res.json(updated);
}

export async function markAllRead(req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: req.userId!, isRead: false },
    data: { isRead: true },
  });
  res.status(204).send();
}
