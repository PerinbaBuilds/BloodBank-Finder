"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { getToken, notificationsApi } from "@/lib/api";
import type { AppNotification } from "@/lib/types";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

interface SocketContextValue {
  socket: Socket | null;
  notifications: AppNotification[];
  unreadCount: number;
  markAllReadLocally: () => void;
  markReadLocally: (id: string) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset local state on logout is intentional
      setSocket(null);
      setNotifications([]);
      return;
    }

    const token = getToken();
    const instance = io(SOCKET_URL, { auth: { token }, withCredentials: true });
    setSocket(instance);

    notificationsApi.list().then(setNotifications).catch(() => undefined);

    return () => {
      instance.disconnect();
    };
    // Key on the user's identity only: a profile refresh replaces the `user`
    // object but keeps the same id, and we don't want to tear down/reconnect the
    // socket (and miss realtime events) on every such refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (notification: AppNotification) => {
      setNotifications((prev) => [notification, ...prev]);
    };
    socket.on("notification:new", handleNotification);
    return () => {
      socket.off("notification:new", handleNotification);
    };
  }, [socket]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllReadLocally = () => setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  const markReadLocally = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, markAllReadLocally, markReadLocally }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
