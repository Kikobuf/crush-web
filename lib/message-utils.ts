import type { ContentPart, Message } from "./types";

export function textOf(message: Message): string {
  const part = message.parts.find((p): p is Extract<ContentPart, { type: "text" }> => p.type === "text");
  return part?.data.text ?? "";
}

export function reasoningOf(message: Message) {
  return message.parts.find(
    (p): p is Extract<ContentPart, { type: "reasoning" }> => p.type === "reasoning",
  )?.data;
}

export function toolCallsOf(message: Message) {
  return message.parts.filter(
    (p): p is Extract<ContentPart, { type: "tool_call" }> => p.type === "tool_call",
  );
}

export function toolResultsOf(message: Message) {
  return message.parts.filter(
    (p): p is Extract<ContentPart, { type: "tool_result" }> => p.type === "tool_result",
  );
}

export function finishOf(message: Message) {
  return message.parts.find(
    (p): p is Extract<ContentPart, { type: "finish" }> => p.type === "finish",
  )?.data;
}

export function shellCommandsOf(message: Message) {
  return message.parts.filter(
    (p): p is Extract<ContentPart, { type: "shell_command" }> => p.type === "shell_command",
  );
}

export function isThinking(message: Message): boolean {
  const reasoning = reasoningOf(message);
  return Boolean(reasoning?.thinking) && !textOf(message) && !finishOf(message);
}

export function formatCost(cost: number): string {
  if (cost === 0) return "$0.00";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function relativeTime(unixSeconds: number): string {
  const deltaMs = Date.now() - unixSeconds * 1000;
  const deltaS = Math.round(deltaMs / 1000);
  if (deltaS < 5) return "just now";
  if (deltaS < 60) return `${deltaS}s ago`;
  const deltaM = Math.round(deltaS / 60);
  if (deltaM < 60) return `${deltaM}m ago`;
  const deltaH = Math.round(deltaM / 60);
  if (deltaH < 24) return `${deltaH}h ago`;
  const deltaD = Math.round(deltaH / 24);
  return `${deltaD}d ago`;
}
