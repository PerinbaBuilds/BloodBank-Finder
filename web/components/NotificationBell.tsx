"use client";

import { useState } from "react";
import Link from "next/link";
import { useSocket } from "@/context/SocketContext";
import { notificationsApi } from "@/lib/api";

export function NotificationBell() {
  const { notifications, unreadCount, markAllReadLocally, markReadLocally } = useSocket();
  const [open, setOpen] = useState(false);

  const handleMarkAll = async () => {
    markAllReadLocally();
    try {
      await notificationsApi.markAllRead();
    } catch {
      // best-effort; local state already updated optimistically
    }
  };

  const handleItemClick = async (id: string, isRead: boolean) => {
    if (isRead) return;
    markReadLocally(id);
    try {
      await notificationsApi.markRead(id);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative">
      <button
        className="relative rounded-full p-2 text-zinc-600 hover:bg-zinc-100"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-zinc-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button onClick={handleMarkAll} className="text-xs font-medium text-red-600 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-zinc-400">No notifications yet</p>
              ) : (
                notifications.slice(0, 8).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n.id, n.isRead)}
                    className={`block w-full border-b border-zinc-50 px-4 py-3 text-left text-sm last:border-0 hover:bg-zinc-50 ${
                      n.isRead ? "" : "bg-red-50/50"
                    }`}
                  >
                    <p className="font-medium text-zinc-900">{n.title}</p>
                    <p className="text-xs text-zinc-500">{n.body}</p>
                  </button>
                ))
              )}
            </div>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-zinc-100 px-4 py-2 text-center text-xs font-medium text-red-600 hover:bg-zinc-50"
            >
              View all
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
