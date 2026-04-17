"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";

type ConversationMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

type ConversationClientProps = {
  conversationId: string;
  currentUserId: string;
  participantName: string;
  initialMessages: ConversationMessage[];
};

export function ConversationClient({
  conversationId,
  currentUserId,
  participantName,
  initialMessages
}: ConversationClientProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>(initialMessages);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [messages]
  );

  async function refreshMessages() {
    const response = await fetch(`/api/messages/${conversationId}`, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { messages: ConversationMessage[] };
    setMessages(data.messages);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      refreshMessages().catch(() => undefined);
    }, 2500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length]);

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = content.trim();
    if (!trimmed) {
      setError("Message cannot be empty.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: trimmed })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({ message: "Could not send message." }))) as {
          message?: string;
        };
        setError(data.message ?? "Could not send message.");
        return;
      }

      setContent("");
      await refreshMessages();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        Chatting with <span className="font-medium">{participantName}</span>
      </div>

      <div className="max-h-[60vh] space-y-3 overflow-y-auto rounded-md border border-slate-200 bg-white p-4">
        {sortedMessages.length === 0 ? (
          <p className="text-sm text-slate-600">No messages yet. Start the conversation.</p>
        ) : (
          sortedMessages.map((message) => {
            const isMine = message.senderId === currentUserId;
            return (
              <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    isMine ? "bg-sky-700 text-white" : "bg-slate-100 text-slate-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`mt-1 text-[11px] ${isMine ? "text-sky-100" : "text-slate-500"}`}>
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSendMessage} className="space-y-3">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          placeholder="Write your message..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
        />
        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
