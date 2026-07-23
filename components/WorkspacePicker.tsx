"use client";

import { useState } from "react";

export function WorkspacePicker({
  recent,
  onOpen,
  error,
}: {
  recent: string[];
  onOpen: (path: string) => void;
  error: string | null;
}) {
  const [path, setPath] = useState("");

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl text-ink-100">
          crush<span className="text-glam">-web</span>
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Point this at a project directory that <code className="text-ink-300">crush serve</code>{" "}
          can see. Two clients pointed at the same path share the same workspace.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (path.trim()) onOpen(path.trim());
          }}
          className="mt-6 flex gap-2"
        >
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/home/you/projects/thing"
            className="flex-1 rounded border border-stage-600 bg-stage-950 px-3 py-2 text-sm text-ink-100 outline-none focus:border-glam"
          />
          <button
            type="submit"
            className="rounded bg-glam px-4 py-2 text-sm font-medium text-stage-950 hover:bg-glam-soft"
          >
            Open
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {recent.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs uppercase tracking-wide text-ink-500">Recent</p>
            <div className="flex flex-col gap-1">
              {recent.map((p) => (
                <button
                  key={p}
                  onClick={() => onOpen(p)}
                  className="truncate rounded border border-stage-700 px-3 py-2 text-left font-mono text-xs text-ink-300 hover:border-stage-600 hover:bg-stage-800"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
