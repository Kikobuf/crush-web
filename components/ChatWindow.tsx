"use client";

import { useEffect, useRef } from "react";
import type { Message, Session } from "@/lib/types";
import { MessageView } from "./MessageView";
import { ChatInput } from "./ChatInput";
import { formatCost, formatTokens } from "@/lib/message-utils";

export function ChatWindow({
  session,
  messages,
  connected,
  onSend,
  onCancel,
}: {
  session: Session | null;
  messages: Message[];
  connected: boolean;
  onSend: (text: string) => void;
  onCancel: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, messages.at(-1)]);

  if (!session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-ink-500">
        <p className="font-display text-lg">No session selected</p>
        <p className="mt-1 text-sm">Pick a session on the left, or start a new one.</p>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-stage-700 px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-base text-ink-100">
            {session.title || "Untitled session"}
          </h1>
          <p className="text-xs text-ink-500">
            {formatTokens(session.prompt_tokens + session.completion_tokens)} tokens ·{" "}
            {formatCost(session.cost)}
          </p>
        </div>
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${connected ? "bg-glam" : "bg-ink-500"}`}
          title={connected ? "Live" : "Disconnected"}
        />
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink-500">No messages yet — say hello.</p>
        )}
        {messages.map((m) => (
          <MessageView key={m.id} message={m} />
        ))}
      </div>

      <ChatInput disabled={!connected} busy={session.is_busy} onSend={onSend} onCancel={onCancel} />
    </div>
  );
}
