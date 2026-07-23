"use client";

import type { PermissionAction, PermissionRequest } from "@/lib/types";

export function PermissionPrompt({
  request,
  onAnswer,
}: {
  request: PermissionRequest;
  onAnswer: (action: PermissionAction) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-lg rounded-t-lg border border-stage-600 bg-stage-900 p-5 sm:rounded-lg">
        <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-gilt">
          <span className="h-1.5 w-1.5 rounded-full bg-gilt" />
          permission requested
        </div>
        <h2 className="font-display text-lg text-ink-100">{request.tool_name}</h2>
        <p className="mt-1 text-sm text-ink-300">{request.description}</p>
        {request.path && (
          <p className="mt-2 truncate font-mono text-xs text-ink-500">{request.path}</p>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => onAnswer("deny")}
            className="rounded border border-stage-600 px-3 py-2 text-sm text-ink-300 hover:bg-stage-800"
          >
            Deny
          </button>
          <button
            onClick={() => onAnswer("allow")}
            className="rounded border border-stage-600 px-3 py-2 text-sm text-ink-100 hover:bg-stage-800"
          >
            Allow once
          </button>
          <button
            onClick={() => onAnswer("allow_session")}
            className="rounded bg-glam px-3 py-2 text-sm font-medium text-stage-950 hover:bg-glam-soft"
          >
            Allow for session
          </button>
        </div>
      </div>
    </div>
  );
}
