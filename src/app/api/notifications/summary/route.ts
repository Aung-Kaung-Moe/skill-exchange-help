import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import {
  getUnreadNotificationCount,
  listNotificationsForUser
} from "@/lib/notifications/notification-service";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [unreadCount, latestNotifications] = await Promise.all([
    getUnreadNotificationCount(session.user.id),
    listNotificationsForUser(session.user.id, 5)
  ]);

  return NextResponse.json({
    unreadCount,
    notifications: latestNotifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString()
    }))
  });
}
