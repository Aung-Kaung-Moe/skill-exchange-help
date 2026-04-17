"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import {
  clearAllNotifications,
  clearNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from "@/lib/notifications/notification-service";

export async function markNotificationReadAction(
  notificationId: string,
  redirectTo?: string
): Promise<void> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await markNotificationAsRead(session.user.id, notificationId);
  redirect(redirectTo ?? "/notifications");
}

export async function markAllNotificationsReadAction(redirectTo?: string): Promise<void> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await markAllNotificationsAsRead(session.user.id);
  redirect(redirectTo ?? "/notifications");
}

export async function clearNotificationAction(
  notificationId: string,
  redirectTo?: string
): Promise<void> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await clearNotification(session.user.id, notificationId);
  redirect(redirectTo ?? "/notifications");
}

export async function clearAllNotificationsAction(redirectTo?: string): Promise<void> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await clearAllNotifications(session.user.id);
  redirect(redirectTo ?? "/notifications");
}
