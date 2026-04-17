import { prisma } from "@/lib/db";
import type { BookingStatus, PreferredSessionMode } from "@prisma/client";
import { createBookingNotification } from "@/lib/notifications/notification-service";

export type CreateBookingInput = {
  message: string;
  proposedDate: Date;
  durationMinutes: number;
  sessionMode: PreferredSessionMode;
  meetingLocation: string;
  meetingLink: string;
};

export type BookingTransitionAction = "accept" | "reject" | "cancel" | "complete";

export type BookingServiceError =
  | "POST_NOT_FOUND"
  | "POST_NOT_OPEN"
  | "ACTIVE_BOOKING_EXISTS"
  | "INVALID_SESSION_MODE"
  | "OWN_POST_NOT_ALLOWED"
  | "BOOKING_NOT_FOUND"
  | "NOT_ALLOWED"
  | "INVALID_STATUS"
  | "CONFLICT";

export async function getBookablePost(postId: string) {
  return prisma.skillPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      userId: true,
      status: true,
      preferredMode: true,
      title: true
    }
  });
}

export async function createBookingForPost(
  postId: string,
  requesterId: string,
  input: CreateBookingInput
) {
  const post = await getBookablePost(postId);

  if (!post) {
    return { ok: false as const, error: "POST_NOT_FOUND" as BookingServiceError };
  }

  if (post.status !== "open") {
    return { ok: false as const, error: "POST_NOT_OPEN" as BookingServiceError };
  }

  if (post.userId === requesterId) {
    return { ok: false as const, error: "OWN_POST_NOT_ALLOWED" as BookingServiceError };
  }

  if (post.preferredMode !== "both" && input.sessionMode !== post.preferredMode) {
    return { ok: false as const, error: "INVALID_SESSION_MODE" as BookingServiceError };
  }

  if (post.preferredMode === "both" && input.sessionMode !== "online" && input.sessionMode !== "in_person") {
    return { ok: false as const, error: "INVALID_SESSION_MODE" as BookingServiceError };
  }

  const activeBooking = await prisma.booking.findFirst({
    where: {
      postId: post.id,
      requesterId,
      status: {
        in: ["pending", "accepted"]
      }
    },
    select: {
      id: true
    }
  });

  if (activeBooking) {
    return { ok: false as const, error: "ACTIVE_BOOKING_EXISTS" as BookingServiceError };
  }

  const completedBookingExists = await prisma.booking.findFirst({
    where: {
      postId: post.id,
      status: "completed"
    },
    select: {
      id: true
    }
  });

  if (completedBookingExists) {
    return { ok: false as const, error: "POST_NOT_OPEN" as BookingServiceError };
  }

  const booking = await prisma.booking.create({
    data: {
      postId: post.id,
      requesterId,
      providerId: post.userId,
      message: input.message,
      proposedDate: input.proposedDate,
      durationMinutes: input.durationMinutes,
      sessionMode: input.sessionMode,
      meetingLocation: input.meetingLocation || null,
      meetingLink: input.meetingLink || null,
      status: "pending"
    },
    select: {
      id: true
    }
  });

  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { fullName: true }
  });

  try {
    await createBookingNotification({
      kind: "booking_request_received",
      recipientUserId: post.userId,
      actorName: requester?.fullName ?? "A student",
      postTitle: post.title,
      bookingId: booking.id
    });
  } catch {
    // Notifications are best-effort and should not block booking creation.
  }

  return { ok: true as const, bookingId: booking.id };
}

export async function getActiveBookingForRequester(postId: string, requesterId: string) {
  return prisma.booking.findFirst({
    where: {
      postId,
      requesterId,
      status: {
        in: ["pending", "accepted"]
      }
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      status: true
    }
  });
}

export async function listIncomingBookingsForUser(userId: string) {
  return prisma.booking.findMany({
    where: {
      providerId: userId,
      status: {
        not: "completed"
      }
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      postId: true,
      requesterId: true,
      providerId: true,
      message: true,
      proposedDate: true,
      durationMinutes: true,
      sessionMode: true,
      meetingLocation: true,
      meetingLink: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      post: {
        select: {
          id: true,
          title: true,
          skillName: true
        }
      },
      requester: {
        select: {
          id: true,
          fullName: true,
          studentProfile: {
            select: {
              username: true
            }
          }
        }
      }
    }
  });
}

export async function listOutgoingBookingsForUser(userId: string) {
  return prisma.booking.findMany({
    where: {
      requesterId: userId,
      status: {
        not: "completed"
      }
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      postId: true,
      requesterId: true,
      providerId: true,
      message: true,
      proposedDate: true,
      durationMinutes: true,
      sessionMode: true,
      meetingLocation: true,
      meetingLink: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      post: {
        select: {
          id: true,
          title: true,
          skillName: true
        }
      },
      provider: {
        select: {
          id: true,
          fullName: true,
          studentProfile: {
            select: {
              username: true
            }
          }
        }
      }
    }
  });
}

export async function getPendingOutgoingBookingForRequester(bookingId: string, requesterId: string) {
  return prisma.booking.findFirst({
    where: {
      id: bookingId,
      requesterId
    },
    select: {
      id: true,
      requesterId: true,
      status: true,
      message: true,
      proposedDate: true,
      durationMinutes: true,
      sessionMode: true,
      meetingLocation: true,
      meetingLink: true,
      post: {
        select: {
          id: true,
          title: true,
          preferredMode: true
        }
      }
    }
  });
}

export async function updatePendingBookingByRequester(
  bookingId: string,
  requesterId: string,
  input: CreateBookingInput
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      requesterId: true,
      status: true,
      post: {
        select: {
          preferredMode: true
        }
      }
    }
  });

  if (!booking) {
    return { ok: false as const, error: "BOOKING_NOT_FOUND" as BookingServiceError };
  }

  if (booking.requesterId !== requesterId) {
    return { ok: false as const, error: "NOT_ALLOWED" as BookingServiceError };
  }

  if (booking.status !== "pending") {
    return { ok: false as const, error: "INVALID_STATUS" as BookingServiceError };
  }

  if (
    booking.post.preferredMode !== "both" &&
    input.sessionMode !== booking.post.preferredMode
  ) {
    return { ok: false as const, error: "INVALID_SESSION_MODE" as BookingServiceError };
  }

  if (
    booking.post.preferredMode === "both" &&
    input.sessionMode !== "online" &&
    input.sessionMode !== "in_person"
  ) {
    return { ok: false as const, error: "INVALID_SESSION_MODE" as BookingServiceError };
  }

  await prisma.booking.update({
    where: {
      id: booking.id
    },
    data: {
      message: input.message,
      proposedDate: input.proposedDate,
      durationMinutes: input.durationMinutes,
      sessionMode: input.sessionMode,
      meetingLocation: input.meetingLocation || null,
      meetingLink: input.meetingLink || null
    }
  });

  return { ok: true as const };
}

function allowedTransition(
  actorId: string,
  requesterId: string,
  providerId: string,
  currentStatus: BookingStatus,
  action: BookingTransitionAction
): BookingStatus | "NOT_ALLOWED" | "INVALID_STATUS" {
  switch (action) {
    case "accept":
      if (actorId !== providerId) return "NOT_ALLOWED";
      if (currentStatus !== "pending") return "INVALID_STATUS";
      return "accepted";
    case "reject":
      if (actorId !== providerId) return "NOT_ALLOWED";
      if (currentStatus !== "pending") return "INVALID_STATUS";
      return "rejected";
    case "cancel":
      if (actorId !== requesterId) return "NOT_ALLOWED";
      if (currentStatus !== "pending") return "INVALID_STATUS";
      return "cancelled";
    case "complete":
      if (actorId !== requesterId && actorId !== providerId) return "NOT_ALLOWED";
      if (currentStatus !== "accepted") return "INVALID_STATUS";
      return "completed";
    default:
      return "NOT_ALLOWED";
  }
}

export async function transitionBookingStatus(
  bookingId: string,
  actorId: string,
  action: BookingTransitionAction
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      requesterId: true,
      providerId: true,
      postId: true,
      status: true,
      post: {
        select: {
          title: true
        }
      },
      requester: {
        select: {
          fullName: true
        }
      },
      provider: {
        select: {
          fullName: true
        }
      }
    }
  });

  if (!booking) {
    return { ok: false as const, error: "BOOKING_NOT_FOUND" as BookingServiceError };
  }

  const nextStatus = allowedTransition(
    actorId,
    booking.requesterId,
    booking.providerId,
    booking.status,
    action
  );

  if (nextStatus === "NOT_ALLOWED") {
    return { ok: false as const, error: "NOT_ALLOWED" as BookingServiceError };
  }

  if (nextStatus === "INVALID_STATUS") {
    return { ok: false as const, error: "INVALID_STATUS" as BookingServiceError };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.updateMany({
      where: {
        id: booking.id,
        status: booking.status
      },
      data: {
        status: nextStatus
      }
    });

    if (updatedBooking.count > 0 && nextStatus === "completed") {
      await tx.skillPost.updateMany({
        where: {
          id: booking.postId
        },
        data: {
          status: "closed"
        }
      });
    }

    return updatedBooking;
  });

  if (updated.count === 0) {
    return { ok: false as const, error: "CONFLICT" as BookingServiceError };
  }

  let recipientUserId: string | null = null;
  let notificationKind:
    | "booking_accepted"
    | "booking_rejected"
    | "booking_cancelled"
    | "booking_completed"
    | null = null;

  if (action === "accept") {
    recipientUserId = booking.requesterId;
    notificationKind = "booking_accepted";
  } else if (action === "reject") {
    recipientUserId = booking.requesterId;
    notificationKind = "booking_rejected";
  } else if (action === "cancel") {
    recipientUserId = booking.providerId;
    notificationKind = "booking_cancelled";
  } else if (action === "complete") {
    recipientUserId = actorId === booking.requesterId ? booking.providerId : booking.requesterId;
    notificationKind = "booking_completed";
  }

  if (recipientUserId && notificationKind) {
    const actorName =
      actorId === booking.requesterId ? booking.requester.fullName : booking.provider.fullName;

    try {
      await createBookingNotification({
        kind: notificationKind,
        recipientUserId,
        actorName,
        postTitle: booking.post.title,
        bookingId: booking.id
      });
    } catch {
      // Notifications are best-effort and should not block booking transitions.
    }
  }

  return { ok: true as const };
}
