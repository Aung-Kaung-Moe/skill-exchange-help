"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import {
  deleteConversationForEveryone,
  deleteConversationForMe
} from "@/lib/chat/chat-service";

function mapConversationDeleteErrorToMessage(error: string) {
  switch (error) {
    case "CONVERSATION_NOT_FOUND":
      return "Conversation not found.";
    case "NOT_ALLOWED":
      return "You are not allowed to modify this conversation.";
    default:
      return "Could not delete conversation.";
  }
}

async function handleDeleteConversation(
  deleteMode: "ME" | "EVERYONE",
  conversationId: string,
  redirectTo?: string
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const result =
    deleteMode === "ME"
      ? await deleteConversationForMe(conversationId, session.user.id)
      : await deleteConversationForEveryone(conversationId, session.user.id);

  if (!result.ok) {
    const destination = redirectTo ?? "/messages";
    const encodedError = encodeURIComponent(mapConversationDeleteErrorToMessage(result.error));
    redirect(`${destination}?error=${encodedError}`);
  }

  redirect("/messages");
}

export async function deleteConversationForMeAction(
  conversationId: string,
  redirectTo?: string
): Promise<void> {
  await handleDeleteConversation("ME", conversationId, redirectTo);
}

export async function deleteConversationForEveryoneAction(
  conversationId: string,
  redirectTo?: string
): Promise<void> {
  await handleDeleteConversation("EVERYONE", conversationId, redirectTo);
}
