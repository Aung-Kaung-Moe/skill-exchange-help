import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { createNotification } from "@/lib/notifications/notification-service";

export type ChatServiceError =
  | "BOOKING_NOT_FOUND"
  | "BOOKING_NOT_ACCEPTED"
  | "CONVERSATION_NOT_FOUND"
  | "NOT_ALLOWED";

function isConversationParticipant(
  userId: string,
  participantOneId: string,
  participantTwoId: string
) {
  return userId === participantOneId || userId === participantTwoId;
}

function buildVisibleConversationWhere(userId: string): Prisma.ConversationWhereInput {
  return {
    OR: [
      { participantOneId: userId, hiddenForParticipantOne: false },
      { participantTwoId: userId, hiddenForParticipantTwo: false }
    ]
  };
}

function getConversationClearCutoff(
  conversation: {
    participantOneId: string;
    participantOneClearedAt: Date | null;
    participantTwoClearedAt: Date | null;
  },
  userId: string
) {
  return conversation.participantOneId === userId
    ? conversation.participantOneClearedAt
    : conversation.participantTwoClearedAt;
}

export async function getOrCreateConversationForAcceptedBooking(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      requesterId: true,
      providerId: true,
      conversation: {
        select: {
          id: true,
          participantOneId: true,
          participantTwoId: true,
          hiddenForParticipantOne: true,
          hiddenForParticipantTwo: true
        }
      }
    }
  });

  if (!booking) {
    return { ok: false as const, error: "BOOKING_NOT_FOUND" as ChatServiceError };
  }

  const isParticipant = isConversationParticipant(
    userId,
    booking.requesterId,
    booking.providerId
  );

  if (!isParticipant) {
    return { ok: false as const, error: "NOT_ALLOWED" as ChatServiceError };
  }

  if (booking.conversation) {
    const shouldUnhideParticipantOne =
      booking.conversation.participantOneId === userId &&
      booking.conversation.hiddenForParticipantOne;
    const shouldUnhideParticipantTwo =
      booking.conversation.participantTwoId === userId &&
      booking.conversation.hiddenForParticipantTwo;

    if (shouldUnhideParticipantOne || shouldUnhideParticipantTwo) {
      await prisma.conversation.update({
        where: {
          id: booking.conversation.id
        },
        data: {
          ...(shouldUnhideParticipantOne ? { hiddenForParticipantOne: false } : {}),
          ...(shouldUnhideParticipantTwo ? { hiddenForParticipantTwo: false } : {})
        }
      });
    }

    return { ok: true as const, conversationId: booking.conversation.id };
  }

  if (booking.status !== "accepted") {
    return { ok: false as const, error: "BOOKING_NOT_ACCEPTED" as ChatServiceError };
  }

  const conversation = await prisma.conversation.upsert({
    where: {
      bookingId: booking.id
    },
    create: {
      bookingId: booking.id,
      participantOneId: booking.requesterId,
      participantTwoId: booking.providerId
    },
    update:
      userId === booking.requesterId
        ? { hiddenForParticipantOne: false }
        : { hiddenForParticipantTwo: false },
    select: {
      id: true
    }
  });

  return { ok: true as const, conversationId: conversation.id };
}

export async function listConversationsForUser(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: buildVisibleConversationWhere(userId),
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      bookingId: true,
      createdAt: true,
      participantOneId: true,
      participantTwoId: true,
      participantOneClearedAt: true,
      participantTwoClearedAt: true,
      booking: {
        select: {
          id: true,
          status: true,
          post: {
            select: {
              id: true,
              title: true,
              skillName: true
            }
          }
        }
      },
      participantOne: {
        select: {
          id: true,
          fullName: true,
          studentProfile: {
            select: {
              username: true
            }
          }
        }
      },
      participantTwo: {
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

  return Promise.all(
    conversations.map(async (conversation) => {
      const clearCutoff = getConversationClearCutoff(conversation, userId);
      const messageVisibilityWhere: Prisma.MessageWhereInput = {
        conversationId: conversation.id,
        ...(clearCutoff ? { createdAt: { gt: clearCutoff } } : {})
      };

      const [latestMessage, unreadCount] = await Promise.all([
        prisma.message.findFirst({
          where: messageVisibilityWhere,
          orderBy: [{ createdAt: "desc" }],
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            isRead: true
          }
        }),
        prisma.message.count({
          where: {
            ...messageVisibilityWhere,
            isRead: false,
            senderId: {
              not: userId
            }
          }
        })
      ]);

      return {
        ...conversation,
        messages: latestMessage ? [latestMessage] : [],
        _count: {
          messages: unreadCount
        }
      };
    })
  );
}

export async function getConversationForUser(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      ...buildVisibleConversationWhere(userId)
    },
    select: {
      id: true,
      bookingId: true,
      createdAt: true,
      participantOneId: true,
      participantTwoId: true,
      booking: {
        select: {
          id: true,
          status: true,
          post: {
            select: {
              id: true,
              title: true,
              skillName: true
            }
          }
        }
      },
      participantOne: {
        select: {
          id: true,
          fullName: true,
          studentProfile: {
            select: {
              username: true
            }
          }
        }
      },
      participantTwo: {
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

  if (!conversation) {
    return { ok: false as const, error: "CONVERSATION_NOT_FOUND" as ChatServiceError };
  }

  return { ok: true as const, conversation };
}

export async function listMessagesForConversationForUser(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      ...buildVisibleConversationWhere(userId)
    },
    select: {
      id: true,
      participantOneId: true,
      participantOneClearedAt: true,
      participantTwoClearedAt: true
    }
  });

  if (!conversation) {
    return { ok: false as const, error: "CONVERSATION_NOT_FOUND" as ChatServiceError };
  }

  const clearCutoff = getConversationClearCutoff(conversation, userId);

  const messages = await prisma.message.findMany({
    where: {
      conversationId: conversation.id,
      ...(clearCutoff ? { createdAt: { gt: clearCutoff } } : {})
    },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      content: true,
      isRead: true,
      createdAt: true
    }
  });

  return { ok: true as const, messages };
}

export async function markMessagesAsReadForUser(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      ...buildVisibleConversationWhere(userId)
    },
    select: {
      id: true,
      participantOneId: true,
      participantOneClearedAt: true,
      participantTwoClearedAt: true
    }
  });

  if (!conversation) {
    return { ok: false as const, error: "CONVERSATION_NOT_FOUND" as ChatServiceError };
  }

  const clearCutoff = getConversationClearCutoff(conversation, userId);

  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      senderId: {
        not: userId
      },
      isRead: false,
      ...(clearCutoff ? { createdAt: { gt: clearCutoff } } : {})
    },
    data: {
      isRead: true
    }
  });

  await prisma.notification.updateMany({
    where: {
      userId,
      type: "new_message",
      relatedEntityType: "conversation",
      relatedEntityId: conversation.id,
      isRead: false
    },
    data: {
      isRead: true
    }
  });

  return { ok: true as const };
}

export async function sendMessageInConversation(
  conversationId: string,
  userId: string,
  content: string
) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      ...buildVisibleConversationWhere(userId)
    },
    select: {
      id: true,
      participantOneId: true,
      participantTwoId: true,
      booking: {
        select: {
          post: {
            select: {
              title: true
            }
          }
        }
      }
    }
  });

  if (!conversation) {
    return { ok: false as const, error: "CONVERSATION_NOT_FOUND" as ChatServiceError };
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: userId,
      content,
      isRead: false
    },
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      content: true,
      isRead: true,
      createdAt: true
    }
  });

  const receiverId =
    conversation.participantOneId === userId
      ? conversation.participantTwoId
      : conversation.participantOneId;
  const preview = content.length > 120 ? `${content.slice(0, 117)}...` : content;

  // If receiver previously chose "Delete for me", reveal conversation again when a new message arrives.
  await prisma.conversation.update({
    where: {
      id: conversation.id
    },
    data:
      receiverId === conversation.participantOneId
        ? { hiddenForParticipantOne: false }
        : { hiddenForParticipantTwo: false }
  });

  await createNotification({
    userId: receiverId,
    type: "new_message",
    title: "New message",
    message: `New message about "${conversation.booking.post.title}": ${preview}`,
    relatedEntityType: "conversation",
    relatedEntityId: conversation.id
  });

  return { ok: true as const, message };
}

export async function getUnreadMessageCountForUser(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: buildVisibleConversationWhere(userId),
    select: {
      id: true,
      participantOneId: true,
      participantOneClearedAt: true,
      participantTwoClearedAt: true
    }
  });

  const unreadCounts = await Promise.all(
    conversations.map((conversation) => {
      const clearCutoff = getConversationClearCutoff(conversation, userId);
      return prisma.message.count({
        where: {
          conversationId: conversation.id,
          isRead: false,
          senderId: {
            not: userId
          },
          ...(clearCutoff ? { createdAt: { gt: clearCutoff } } : {})
        }
      });
    })
  );

  return unreadCounts.reduce((total, count) => total + count, 0);
}

export async function deleteConversationForMe(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ participantOneId: userId }, { participantTwoId: userId }]
    },
    select: {
      id: true,
      participantOneId: true,
      hiddenForParticipantOne: true,
      hiddenForParticipantTwo: true
    }
  });

  if (!conversation) {
    return { ok: false as const, error: "CONVERSATION_NOT_FOUND" as ChatServiceError };
  }

  const updated = await prisma.conversation.update({
    where: {
      id: conversation.id
    },
    data:
      conversation.participantOneId === userId
        ? {
            hiddenForParticipantOne: true,
            participantOneClearedAt: new Date()
          }
        : {
            hiddenForParticipantTwo: true,
            participantTwoClearedAt: new Date()
          },
    select: {
      id: true,
      hiddenForParticipantOne: true,
      hiddenForParticipantTwo: true
    }
  });

  await prisma.notification.deleteMany({
    where: {
      userId,
      type: "new_message",
      relatedEntityType: "conversation",
      relatedEntityId: conversation.id
    }
  });

  if (updated.hiddenForParticipantOne && updated.hiddenForParticipantTwo) {
    await prisma.conversation.delete({
      where: {
        id: updated.id
      }
    });
  }

  return { ok: true as const };
}

export async function deleteConversationForEveryone(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ participantOneId: userId }, { participantTwoId: userId }]
    },
    select: {
      id: true
    }
  });

  if (!conversation) {
    return { ok: false as const, error: "CONVERSATION_NOT_FOUND" as ChatServiceError };
  }

  await prisma.conversation.delete({
    where: {
      id: conversation.id
    }
  });

  return { ok: true as const };
}
