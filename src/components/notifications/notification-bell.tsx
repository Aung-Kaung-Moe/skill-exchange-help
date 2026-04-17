import {
  getUnreadNotificationCount,
  listNotificationsForUser
} from "@/lib/notifications/notification-service";
import { NotificationBellClient } from "@/components/notifications/notification-bell-client";

type NotificationBellProps = {
  userId: string;
};

export async function NotificationBell({ userId }: NotificationBellProps) {
  const [unreadCount, latestNotifications] = await Promise.all([
    getUnreadNotificationCount(userId),
    listNotificationsForUser(userId, 5)
  ]);

  return (
    <NotificationBellClient
      initialUnreadCount={unreadCount}
      initialNotifications={latestNotifications.map((notification) => ({
        ...notification,
        createdAt: notification.createdAt.toISOString()
      }))}
    />
  );
}
