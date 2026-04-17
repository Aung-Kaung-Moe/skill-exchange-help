"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ActivityMenuProps = {
  initialUnreadMessageCount: number;
};

export function ActivityMenu({ initialUnreadMessageCount }: ActivityMenuProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadMessageCount);

  useEffect(() => {
    let isMounted = true;

    async function refreshUnreadCount() {
      const response = await fetch("/api/messages/unread-count", {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok || !isMounted) {
        return;
      }

      let data: { unreadCount: number } | null = null;
      try {
        data = (await response.json()) as { unreadCount: number };
      } catch {
        return;
      }

      if (!data || typeof data.unreadCount !== "number") {
        return;
      }

      setUnreadCount(data.unreadCount);
    }

    refreshUnreadCount().catch(() => undefined);
    const interval = setInterval(() => {
      refreshUnreadCount().catch(() => undefined);
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
        className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100"
      >
        Activity
      </button>

      <div className="invisible pointer-events-none absolute right-0 z-50 mt-2 w-52 rounded-lg border border-slate-200 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <Link
          href="/bookings"
          className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Bookings
        </Link>
        <Link
          href="/messages"
          className="mt-1 flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          <span>Messages</span>
          {unreadCount > 0 ? (
            <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-xs font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Link>
      </div>
    </div>
  );
}
