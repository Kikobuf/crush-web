"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/lib/types";
import {
  finishOf,
  isThinking,
  reasoningOf,
  shellCommandsOf,
  textOf,
  toolCallsOf,
  toolResultsOf,
} from "@/lib/message-utils";

function ToolCallBlock({
  call,
  result,
}: {
  call: ReturnType<typeof toolCallsOf>[number];
  result?: ReturnType<typeof toolResultsOf>[number];
}) {
  const [open, setOpen] = useState(false);
  const isError = result?.data.is_error;

  return (
    <div
      className={`my-2 rounded border font-mono text-sm ${
        isError ? "border-red-900/60 bg-red-950/20" : "border-stage-600 bg-stage-800/60"
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            !call.data.finished
              ? "animate-pulseheart bg-gilt"
              : isError
                ? "bg-red-500"
                : "bg-glam"
          }`}
        />
        <span className="text-ink-100">{call.data.name}</span>
        <span className="truncate text-ink-500">{call.data.input.slice(0, 80)}</span>
        <span className="ml-auto shrink-0 text-ink-500">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="border-t border-stage-600 px-3 py-2 text-xs">
          <div className="mb-1 text-ink-500">input</div>
          <pre className="mb-2 whitespace-pre-wrap break-all text-ink-300">{call.data.input}</pre>
          {result && (
            <>
              <div className="mb-1 text-ink-500">{isError ? "error" : "result"}</div>
              <pre className="whitespace-pre-wrap break-all text-ink-300">{result.data.content}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function MessageView({ message }: { message: Message }) {
  const text = textOf(message);
  const reasoning = reasoningOf(message);
  const calls = toolCallsOf(message);
  const results = toolResultsOf(message);
  const shellCommands = shellCommandsOf(message);
  const finish = finishOf(message);
  const thinking = isThinking(message);

  const resultByCallId = new Map(results.map((r) => [r.data.tool_call_id, r]));

  const roleLabel = message.role === "assistant" ? "crush" : message.role;

  return (
    <div className="flex gap-3 px-4 py-3">
      <div
        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
          message.role === "user" ? "bg-ink-500" : "bg-glam"
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline gap-2 text-xs uppercase tracking-wide text-ink-500">
          <span>{roleLabel}</span>
          {message.model && <span className="normal-case text-ink-500/70">{message.model}</span>}
        </div>

        {reasoning?.thinking && (
          <details className="mb-2 text-sm text-ink-500" open={thinking}>
            <summary className="cursor-pointer select-none italic">
              {thinking ? "thinking…" : "reasoning"}
            </summary>
            <p className="mt-1 whitespace-pre-wrap italic text-ink-500">{reasoning.thinking}</p>
          </details>
        )}

        {shellCommands.map((s, i) => (
          <div key={i} className="my-2 rounded border border-stage-600 bg-stage-950 p-3 font-mono text-sm">
            <div className="text-ink-500">$ {s.data.command}</div>
            <pre className="mt-1 whitespace-pre-wrap text-ink-300">{s.data.output}</pre>
          </div>
        ))}

        {calls.map((call) => (
          <ToolCallBlock key={call.data.id} call={call} result={resultByCallId.get(call.data.id)} />
        ))}

        {text && (
          <div className="prose prose-invert prose-sm max-w-none prose-p:text-ink-100 prose-pre:bg-stage-950">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          </div>
        )}

        {finish?.reason === "error" && (
          <p className="mt-1 text-sm text-red-400">{finish.message || "The turn ended with an error."}</p>
        )}
        {finish?.reason === "canceled" && <p className="mt-1 text-sm text-ink-500">Cancelled.</p>}
      </div>
    </div>
  );
}
