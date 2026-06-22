import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { notificationsApi } from "../lib/api";
import { getToken } from "../lib/storage";
import type { AppNotification } from "../lib/types";

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

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
      setSocket(null);
      setNotifications([]);
      return;
    }

    let instance: Socket | undefined;
    let cancelled = false;

    getToken().then((token) => {
      if (cancelled) return;
      instance = io(SOCKET_URL, { auth: { token } });
      setSocket(instance);
    });

    notificationsApi.list().then(setNotifications).catch(() => undefined);

    return () => {
      cancelled = true;
      instance?.disconnect();
    };
  }, [user]);

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
