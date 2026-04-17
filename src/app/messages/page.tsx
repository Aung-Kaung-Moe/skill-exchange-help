import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  deleteConversationForEveryoneAction,
  deleteConversationForMeAction
} from "@/lib/actions/chat-actions";
import { authOptions } from "@/lib/auth/auth-options";
import {
  getOrCreateConversationForAcceptedBooking,
  listConversationsForUser
} from "@/lib/chat/chat-service";

type MessagesPageProps = {
  searchParams: Promise<{ bookingId?: string; error?: string }>;
};

function mapConversationStartError(error: string) {
  switch (error) {
    case "BOOKING_NOT_FOUND":
      return "Booking not found.";
    case "BOOKING_NOT_ACCEPTED":
      return "Chat is available only after booking acceptance.";
    case "NOT_ALLOWED":
      return "You are not allowed to access that booking chat.";
    default:
      return "Could not open chat.";
  }
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (params.bookingId) {
    const conversation = await getOrCreateConversationForAcceptedBooking(
      params.bookingId,
      session.user.id
    );

    if (conversation.ok) {
      redirect(`/messages/${conversation.conversationId}`);
    }

    const encodedError = encodeURIComponent(mapConversationStartError(conversation.error));
    redirect(`/messages?error=${encodedError}`);
  }

  const conversations = await listConversationsForUser(session.user.id);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-slate-600">
          Chat with your booking partner after a booking is accepted.
        </p>
      </div>

      {params.error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {params.error}
        </p>
      ) : null}

      {conversations.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No conversations yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {conversations.map((conversation) => {
            const otherParticipant =
              conversation.participantOneId === session.user.id
                ? conversation.participantTwo
                : conversation.participantOne;
            const latestMessage = conversation.messages[0];
            const unreadCount = conversation._count.messages;

            return (
              <article
                key={conversation.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      <Link href={`/messages/${conversation.id}`} className="hover:underline">
                        {otherParticipant.fullName}
                        {otherParticipant.studentProfile?.username
                          ? ` (@${otherParticipant.studentProfile.username})`
                          : ""}
                      </Link>
                    </h2>
                    <p className="text-sm text-slate-600">
                      Post:{" "}
                      <Link href={`/posts/${conversation.booking.post.id}`} className="font-medium hover:underline">
                        {conversation.booking.post.title}
                      </Link>
                    </p>
                    {latestMessage ? (
                      <p className="mt-2 text-sm text-slate-700">
                        {latestMessage.senderId === session.user.id ? "You: " : ""}
                        {latestMessage.content}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">No messages yet.</p>
                    )}
                  </div>

                  <div className="text-right">
                    {unreadCount > 0 ? (
                      <p className="rounded-full bg-rose-600 px-2 py-1 text-xs font-semibold text-white">
                        {unreadCount} unread
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">Read</p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">
                      {latestMessage
                        ? latestMessage.createdAt.toLocaleString()
                        : conversation.createdAt.toLocaleString()}
                    </p>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <form action={deleteConversationForMeAction.bind(null, conversation.id, "/messages")}>
                        <button
                          type="submit"
                          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Delete for me
                        </button>
                      </form>
                      <form
                        action={deleteConversationForEveryoneAction.bind(
                          null,
                          conversation.id,
                          "/messages"
                        )}
                      >
                        <button
                          type="submit"
                          className="rounded-md border border-rose-300 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                        >
                          Delete for everyone
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
