import { Prisma } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { getIO } from "@/sockets";

export interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
}

export async function notifyUser(userId: string, payload: NotificationPayload) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    },
  });
  getIO()?.to(`user:${userId}`).emit("notification:new", notification);
  return notification;
}

export async function notifyUsers(userIds: string[], payload: NotificationPayload) {
  return Promise.all(userIds.map((userId) => notifyUser(userId, payload)));
}
