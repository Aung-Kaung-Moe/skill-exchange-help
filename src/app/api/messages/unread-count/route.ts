import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { getUnreadMessageCountForUser } from "@/lib/chat/chat-service";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const unreadCount = await getUnreadMessageCountForUser(session.user.id);
  return NextResponse.json({ unreadCount });
}
