"use client";

import { useState } from "react";
import type { QuestionRequest, QuestionResponse } from "@/lib/types";

// Crush's QuestionItem.type is a free-form string set by whatever tool
// asked the question, not a closed enum, so this renders generically:
// choices present -> pick-one buttons, otherwise -> free text. Good
// enough for the common cases (confirm, single-select, fill-in) without
// hardcoding a specific tool's vocabulary.

export function QuestionPrompt({
  request,
  onAnswer,
}: {
  request: QuestionRequest;
  onAnswer: (answers: QuestionResponse[]) => void;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [freeText, setFreeText] = useState<Record<string, string>>({});

  const current = request.questions[activeTab];
  const isLast = activeTab === request.questions.length - 1;

  function submitCurrentAndAdvance() {
    if (isLast) {
      const responses: QuestionResponse[] = request.questions.map((q) => ({
        request_id: q.id,
        selected_ids: selected[q.id] ? [selected[q.id]] : undefined,
        fill_in_text: freeText[q.id],
      }));
      onAnswer(responses);
    } else {
      setActiveTab((t) => t + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-lg rounded-t-lg border border-stage-600 bg-stage-900 p-5 sm:rounded-lg">
        {request.confirm_title && (
          <h2 className="mb-1 font-display text-lg text-ink-100">{request.confirm_title}</h2>
        )}
        {request.confirm_description && (
          <p className="mb-3 text-sm text-ink-300">{request.confirm_description}</p>
        )}

        {request.questions.length > 1 && (
          <div className="mb-3 flex gap-1 border-b border-stage-600 text-xs">
            {request.questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setActiveTab(i)}
                className={`px-2 py-1 ${
                  i === activeTab ? "border-b-2 border-glam text-ink-100" : "text-ink-500"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        <p className="text-sm text-ink-100">{current.question}</p>
        {current.description && <p className="mt-1 text-xs text-ink-500">{current.description}</p>}

        {current.choices?.length ? (
          <div className="mt-3 flex flex-col gap-2">
            {current.choices.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected((s) => ({ ...s, [current.id]: c.id }))}
                className={`rounded border px-3 py-2 text-left text-sm ${
                  selected[current.id] === c.id
                    ? "border-glam bg-glam/10 text-ink-100"
                    : "border-stage-600 text-ink-300 hover:bg-stage-800"
                }`}
              >
                {c.label}
                {c.description && <div className="text-xs text-ink-500">{c.description}</div>}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            value={freeText[current.id] || ""}
            onChange={(e) => setFreeText((s) => ({ ...s, [current.id]: e.target.value }))}
            className="mt-3 w-full rounded border border-stage-600 bg-stage-950 p-2 text-sm text-ink-100 outline-none focus:border-glam"
            rows={3}
            placeholder="Your answer…"
          />
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={submitCurrentAndAdvance}
            className="rounded bg-glam px-4 py-2 text-sm font-medium text-stage-950 hover:bg-glam-soft"
          >
            {isLast ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
