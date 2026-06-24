import { Prisma } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { getIO } from "@/sockets";
import { sendEmail } from "@/services/email.service";
import { sendSms } from "@/services/sms.service";

export interface NotificationPayload {
  type: string;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
}

export async function notifyUser(userId: string, payload: NotificationPayload) {
  const [notification, user] = await Promise.all([
    prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data,
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, phone: true } }),
  ]);

  getIO()?.to(`user:${userId}`).emit("notification:new", notification);

  if (user) {
    await Promise.all([
      sendEmail({ to: user.email, subject: payload.title, text: payload.body }),
      sendSms({ to: user.phone, body: `${payload.title}: ${payload.body}` }),
    ]);
  }

  return notification;
}

export async function notifyUsers(userIds: string[], payload: NotificationPayload) {
  return Promise.all(userIds.map((userId) => notifyUser(userId, payload)));
}
