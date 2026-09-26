import { pulseLines } from "./run.ts";
import { THRESHOLDS, type Line, type SessionState } from "../types.ts";

export function burstToLines(
  raw: string,
  sessionId: string,
  user: string,
  clockMs = Date.now(),
): Line[] {
  const rows = raw
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .slice(0, THRESHOLDS.recentLineCap);
  return rows.map((text, i) => ({
    id: crypto.randomUUID(),
    sessionId,
    clockMs: clockMs + i,
    user: user.replace(/^@/, "") || "chat",
    text: text.slice(0, 280),
  }));
}

export async function scoutBurst(
  session: SessionState,
  raw: string,
  user: string,
): Promise<{ session: SessionState; scouted: number }> {
  const lines = burstToLines(raw, session.id, user);
  if (!lines.length) return { session, scouted: 0 };
  const next = await pulseLines(session, lines);
  return { session: next, scouted: lines.length };
}
