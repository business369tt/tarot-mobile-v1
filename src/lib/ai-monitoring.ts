type AiMonitorPayload = Record<string, unknown>;

function normalizePayload(payload: AiMonitorPayload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

export function logAiEvent(
  event: string,
  payload: AiMonitorPayload = {},
  level: "info" | "warn" | "error" = "info",
) {
  const entry = {
    ts: new Date().toISOString(),
    event,
    ...normalizePayload(payload),
  };
  const message = `[ai-monitor] ${JSON.stringify(entry)}`;

  if (level === "warn") {
    console.warn(message);
    return;
  }

  if (level === "error") {
    console.error(message);
    return;
  }

  console.info(message);
}
