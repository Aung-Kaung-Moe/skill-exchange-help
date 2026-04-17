import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ConversationClient } from "@/components/messages/conversation-client";
import {
  deleteConversationForEveryoneAction,
  deleteConversationForMeAction
} from "@/lib/actions/chat-actions";
import { authOptions } from "@/lib/auth/auth-options";
import {
  getConversationForUser,
  listMessagesForConversationForUser,
  markMessagesAsReadForUser
} from "@/lib/chat/chat-service";

type ConversationPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const conversationResult = await getConversationForUser(id, session.user.id);

  if (!conversationResult.ok) {
    notFound();
  }

  await markMessagesAsReadForUser(id, session.user.id);

  const messagesResult = await listMessagesForConversationForUser(id, session.user.id);

  if (!messagesResult.ok) {
    notFound();
  }

  const conversation = conversationResult.conversation;
  const otherParticipant =
    conversation.participantOneId === session.user.id
      ? conversation.participantTwo
      : conversation.participantOne;

  const serializedMessages = messagesResult.messages.map((message) => ({
    ...message,
    createdAt: message.createdAt.toISOString()
  }));

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Conversation</h1>
          <p className="text-sm text-slate-600">
            {otherParticipant.fullName}
            {otherParticipant.studentProfile?.username
              ? ` (@${otherParticipant.studentProfile.username})`
              : ""}
          </p>
          <p className="text-sm text-slate-600">
            About:{" "}
            <Link href={`/posts/${conversation.booking.post.id}`} className="font-medium hover:underline">
              {conversation.booking.post.title}
            </Link>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form action={deleteConversationForMeAction.bind(null, conversation.id, `/messages/${conversation.id}`)}>
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Delete for me
            </button>
          </form>
          <form
            action={deleteConversationForEveryoneAction.bind(
              null,
              conversation.id,
              `/messages/${conversation.id}`
            )}
          >
            <button
              type="submit"
              className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              Delete for everyone
            </button>
          </form>
          <Link
            href="/messages"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Back to Messages
          </Link>
        </div>
      </div>

      <ConversationClient
        conversationId={conversation.id}
        currentUserId={session.user.id}
        participantName={otherParticipant.fullName}
        initialMessages={serializedMessages}
      />
    </section>
  );
}
