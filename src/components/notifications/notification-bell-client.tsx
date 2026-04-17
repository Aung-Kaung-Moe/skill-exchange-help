"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearAllNotificationsAction,
  markAllNotificationsReadAction
} from "@/lib/actions/notification-actions";

type NotificationItem = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityType: "booking" | "post" | "review" | "conversation" | null;
  relatedEntityId: string | null;
  createdAt: string;
};

type NotificationBellClientProps = {
  initialUnreadCount: number;
  initialNotifications: NotificationItem[];
};

function resolveNotificationHref(
  relatedEntityType: NotificationItem["relatedEntityType"],
  relatedEntityId: string | null
) {
  if (relatedEntityType === "post" && relatedEntityId) {
    return `/posts/${relatedEntityId}`;
  }

  if (relatedEntityType === "conversation" && relatedEntityId) {
    return `/messages/${relatedEntityId}`;
  }

  if (relatedEntityType === "booking") {
    return "/bookings";
  }

  if (relatedEntityType === "review") {
    return "/profile/me";
  }

  return "/notifications";
}

export function NotificationBellClient({
  initialUnreadCount,
  initialNotifications
}: NotificationBellClientProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    let isMounted = true;

    async function refreshSummary() {
      const response = await fetch("/api/notifications/summary", {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok || !isMounted) {
        return;
      }

      let data: { unreadCount: number; notifications: NotificationItem[] } | null = null;
      try {
        data = (await response.json()) as {
          unreadCount: number;
          notifications: NotificationItem[];
        };
      } catch {
        return;
      }

      if (!data || typeof data.unreadCount !== "number" || !Array.isArray(data.notifications)) {
        return;
      }

      setUnreadCount(data.unreadCount);
      setNotifications(data.notifications);
    }

    refreshSummary().catch(() => undefined);
    const interval = setInterval(() => {
      refreshSummary().catch(() => undefined);
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="group relative">
      <button
        type="button"
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
              <path d="M9 17a3 3 0 0 0 6 0" />
            </svg>
          </span>
          <span>Notifications</span>
          {unreadCount > 0 ? (
            <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-xs font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </span>
      </button>

      <div className="invisible pointer-events-none absolute right-0 z-50 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 opacity-0 shadow-lg transition group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Recent</p>
          <Link href="/notifications" className="text-xs font-medium text-sky-700 hover:text-sky-800">
            View all
          </Link>
        </div>

        {notifications.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            No notifications yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <Link
                  href={resolveNotificationHref(
                    notification.relatedEntityType,
                    notification.relatedEntityId
                  )}
                  className={`block rounded-md border px-3 py-2 text-sm ${
                    notification.isRead
                      ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                      : "border-sky-300 bg-sky-50 text-slate-800 hover:bg-sky-100"
                  }`}
                >
                  <p className="font-medium">{notification.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs">{notification.message}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {notifications.length > 0 ? (
          <div className="mt-3 grid gap-2">
            {unreadCount > 0 ? (
              <form action={markAllNotificationsReadAction.bind(null, "/notifications")}>
                <button
                  type="submit"
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Mark all as read
                </button>
              </form>
            ) : null}
            <form action={clearAllNotificationsAction.bind(null, "/notifications")}>
              <button
                type="submit"
                className="w-full rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
              >
                Clear all
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
