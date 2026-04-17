import { prisma } from "@/lib/db";
import type { NotificationType, RelatedEntityType } from "@prisma/client";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: RelatedEntityType | null;
  relatedEntityId?: string | null;
};

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      relatedEntityType: input.relatedEntityType ?? null,
      relatedEntityId: input.relatedEntityId ?? null
    }
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false
    }
  });
}

export async function listNotificationsForUser(userId: string, limit?: number) {
  return prisma.notification.findMany({
    where: {
      userId
    },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      userId: true,
      type: true,
      title: true,
      message: true,
      isRead: true,
      relatedEntityType: true,
      relatedEntityId: true,
      createdAt: true
    }
  });
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId
    },
    data: {
      isRead: true
    }
  });

  return result.count > 0;
}

export async function markAllNotificationsAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });

  return result.count;
}

export async function clearNotification(userId: string, notificationId: string) {
  const result = await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId
    }
  });

  return result.count > 0;
}

export async function clearAllNotifications(userId: string) {
  const result = await prisma.notification.deleteMany({
    where: {
      userId
    }
  });

  return result.count;
}

type BookingNotificationKind =
  | "booking_request_received"
  | "booking_accepted"
  | "booking_rejected"
  | "booking_cancelled"
  | "booking_completed";

export async function createBookingNotification(params: {
  kind: BookingNotificationKind;
  recipientUserId: string;
  actorName: string;
  postTitle: string;
  bookingId: string;
}) {
  const titleMap: Record<BookingNotificationKind, string> = {
    booking_request_received: "New booking request",
    booking_accepted: "Booking accepted",
    booking_rejected: "Booking rejected",
    booking_cancelled: "Booking cancelled",
    booking_completed: "Booking completed"
  };

  const messageMap: Record<BookingNotificationKind, string> = {
    booking_request_received: `${params.actorName} requested a session for "${params.postTitle}".`,
    booking_accepted: `${params.actorName} accepted your booking for "${params.postTitle}".`,
    booking_rejected: `${params.actorName} rejected your booking for "${params.postTitle}".`,
    booking_cancelled: `${params.actorName} cancelled the booking for "${params.postTitle}".`,
    booking_completed: `${params.actorName} marked the booking for "${params.postTitle}" as completed.`
  };

  return createNotification({
    userId: params.recipientUserId,
    type: params.kind,
    title: titleMap[params.kind],
    message: messageMap[params.kind],
    relatedEntityType: "booking",
    relatedEntityId: params.bookingId
  });
}

// Hook this function from review creation workflows to generate "new review received" notifications.
export async function createNewReviewReceivedNotification(params: {
  recipientUserId: string;
  reviewerName: string;
  reviewId?: string;
}) {
  return createNotification({
    userId: params.recipientUserId,
    type: "new_review_received",
    title: "New review received",
    message: `${params.reviewerName} left you a new review.`,
    relatedEntityType: params.reviewId ? "review" : null,
    relatedEntityId: params.reviewId ?? null
  });
}
