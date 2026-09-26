import { applyPulse } from "../compose/pulse.ts";
import { judgeLine } from "../jev/client.ts";
import { READING_TYPES, type Line, type ReadingType, type SessionState } from "../types.ts";

export async function pulseLines(
  session: SessionState,
  lines: Line[],
): Promise<SessionState> {
  let next = session;
  for (const line of lines) {
    if (!line.text.trim()) continue;
    const judgment = await judgeLine({
      line,
      live: next.live.filter((r) => r.mark !== "closed"),
      window: next.window,
      allow: READING_TYPES as unknown as ReadingType[],
    });
    next = applyPulse(next, line, judgment);
  }
  return next;
}
