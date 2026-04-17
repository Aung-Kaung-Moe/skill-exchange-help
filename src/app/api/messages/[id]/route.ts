import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import {
  listMessagesForConversationForUser,
  markMessagesAsReadForUser,
  sendMessageInConversation
} from "@/lib/chat/chat-service";
import { chatMessageSchema } from "@/lib/validations/chat";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const marked = await markMessagesAsReadForUser(id, session.user.id);
  if (!marked.ok) {
    return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
  }

  const messages = await listMessagesForConversationForUser(id, session.user.id);
  if (!messages.ok) {
    return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({
    messages: messages.messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString()
    }))
  });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const parsedBody = chatMessageSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { message: parsedBody.error.issues[0]?.message ?? "Invalid message." },
      { status: 400 }
    );
  }

  const sent = await sendMessageInConversation(id, session.user.id, parsedBody.data.content);
  if (!sent.ok) {
    return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({
    message: {
      ...sent.message,
      createdAt: sent.message.createdAt.toISOString()
    }
  });
}
