import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  clearAllNotificationsAction,
  clearNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction
} from "@/lib/actions/notification-actions";
import { authOptions } from "@/lib/auth/auth-options";
import {
  getUnreadNotificationCount,
  listNotificationsForUser
} from "@/lib/notifications/notification-service";

function resolveNotificationHref(
  relatedEntityType: "booking" | "post" | "review" | "conversation" | null,
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

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [notifications, unreadCount] = await Promise.all([
    listNotificationsForUser(session.user.id),
    getUnreadNotificationCount(session.user.id)
  ]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-600">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.` : "All caught up."}
          </p>
        </div>

        {notifications.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {unreadCount > 0 ? (
              <form action={markAllNotificationsReadAction.bind(null, "/notifications")}>
                <button
                  type="submit"
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Mark all as read
                </button>
              </form>
            ) : null}
            <form action={clearAllNotificationsAction.bind(null, "/notifications")}>
              <button
                type="submit"
                className="rounded-md border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                Clear all
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No notifications yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-lg border bg-white p-4 shadow-sm ${
                notification.isRead ? "border-slate-200" : "border-sky-300"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-slate-900">{notification.title}</h2>
                  <p className="mt-1 text-sm text-slate-700">{notification.message}</p>
                  <p className="mt-2 text-xs text-slate-500">{notification.createdAt.toLocaleString()}</p>
                </div>
                {!notification.isRead ? (
                  <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">
                    Unread
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={resolveNotificationHref(
                    notification.relatedEntityType,
                    notification.relatedEntityId
                  )}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Open
                </Link>

                {!notification.isRead ? (
                  <form
                    action={markNotificationReadAction.bind(
                      null,
                      notification.id,
                      "/notifications"
                    )}
                  >
                    <button
                      type="submit"
                      className="rounded-md border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Mark as read
                    </button>
                  </form>
                ) : null}

                <form
                  action={clearNotificationAction.bind(
                    null,
                    notification.id,
                    "/notifications"
                  )}
                >
                  <button
                    type="submit"
                    className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
                  >
                    Clear
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
