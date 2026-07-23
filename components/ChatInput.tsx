"use client";

import { useState, type KeyboardEvent } from "react";

export function ChatInput({
  disabled,
  busy,
  onSend,
  onCancel,
}: {
  disabled: boolean;
  busy: boolean;
  onSend: (text: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-stage-700 bg-stage-900 p-3">
      <div className="flex items-end gap-2 rounded-lg border border-stage-600 bg-stage-950 p-2 focus-within:border-glam">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "Connecting…" : "Message Crush…  (Enter to send, Shift+Enter for a new line)"}
          rows={1}
          className="max-h-40 flex-1 resize-none bg-transparent p-1 text-sm text-ink-100 outline-none placeholder:text-ink-500"
        />
        {busy ? (
          <button
            onClick={onCancel}
            className="shrink-0 rounded border border-stage-600 px-3 py-1.5 text-xs text-ink-300 hover:bg-stage-800"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="shrink-0 rounded bg-glam px-3 py-1.5 text-xs font-medium text-stage-950 hover:bg-glam-soft disabled:opacity-40"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
