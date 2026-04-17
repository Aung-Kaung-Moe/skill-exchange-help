"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MessagesNavLinkProps = {
  initialUnreadCount: number;
};

export function MessagesNavLink({ initialUnreadCount }: MessagesNavLinkProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

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

      const data = (await response.json()) as { unreadCount: number };
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
    <Link href="/messages" className="font-medium text-slate-700 hover:text-slate-900">
      <span className="inline-flex items-center gap-2">
        <span>Messages</span>
        {unreadCount > 0 ? (
          <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-xs font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
