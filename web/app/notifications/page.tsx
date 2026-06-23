"use client";

import Link from "next/link";
import { BellOff } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useSocket } from "@/context/SocketContext";
import { notificationsApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function NotificationsList() {
  const { notifications, unreadCount, markAllReadLocally, markReadLocally } = useSocket();

  const handleMarkAllRead = async () => {
    markAllReadLocally();
    await notificationsApi.markAllRead().catch(() => undefined);
  };

  const handleMarkRead = async (id: string) => {
    markReadLocally(id);
    await notificationsApi.markRead(id).catch(() => undefined);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {notifications.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-10 text-center">
            <BellOff className="h-8 w-8 text-zinc-300" />
            <p className="text-sm text-zinc-500">You don&apos;t have any notifications yet.</p>
          </Card>
        ) : (
          notifications.map((notification) => {
            const requestId =
              notification.data && typeof notification.data.requestId === "string"
                ? notification.data.requestId
                : null;
            const content = (
              <Card
                className={`flex flex-col gap-1 transition-shadow hover:shadow-md ${
                  notification.isRead ? "" : "border-red-300 bg-red-50/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-zinc-900">{notification.title}</p>
                  {!notification.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-red-600" />}
                </div>
                <p className="text-sm text-zinc-600">{notification.body}</p>
                <p className="text-xs text-zinc-400">{new Date(notification.createdAt).toLocaleString()}</p>
              </Card>
            );

            return (
              <div key={notification.id} onClick={() => !notification.isRead && handleMarkRead(notification.id)}>
                {requestId ? <Link href={`/requests/${requestId}`}>{content}</Link> : content}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsList />
    </ProtectedRoute>
  );
}
