"use client";

import type { Session } from "@/lib/types";
import { formatCost, relativeTime } from "@/lib/message-utils";

export function SessionSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onCreate,
}: {
  sessions: Session[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  const sorted = [...sessions].sort((a, b) => b.updated_at - a.updated_at);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-stage-700 bg-stage-900">
      <div className="flex items-center justify-between px-3 py-3">
        <span className="font-display text-sm tracking-wide text-ink-500">SESSIONS</span>
        <button
          onClick={onCreate}
          className="rounded border border-stage-600 px-2 py-1 text-xs text-ink-300 hover:bg-stage-800 hover:text-ink-100"
        >
          + new
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 && (
          <p className="px-3 py-2 text-sm text-ink-500">No sessions yet.</p>
        )}
        {sorted.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`block w-full border-l-2 px-3 py-2 text-left ${
              s.id === activeSessionId
                ? "border-glam bg-stage-800"
                : "border-transparent hover:bg-stage-800/60"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {s.is_busy && <span className="h-1.5 w-1.5 shrink-0 animate-pulseheart rounded-full bg-glam" />}
              <span className="truncate text-sm text-ink-100">{s.title || "Untitled session"}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
              <span>{relativeTime(s.updated_at)}</span>
              <span>·</span>
              <span>{formatCost(s.cost)}</span>
              {s.attached_clients > 1 && (
                <>
                  <span>·</span>
                  <span className="text-gilt">{s.attached_clients} viewing</span>
                </>
              )}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
