import { composeMark, liveIsSplit } from "./marks.ts";
import { judgeLine } from "../jev/client.ts";
import { READING_TYPES, type Line, type ReadingType, type SessionState } from "../types.ts";

export async function restampLive(session: SessionState): Promise<SessionState> {
  const open = session.live.filter((r) => r.mark !== "closed");
  const next = [];
  for (const reading of open) {
    if (reading.mark === "hold") {
      next.push(reading);
      continue;
    }
    const line: Line = {
      id: reading.lineIds[0] ?? reading.id,
      sessionId: session.id,
      clockMs: reading.openedMs,
      user: "restamp",
      text: reading.label,
    };
    const judgment = await judgeLine({
      line,
      live: open.filter((r) => r.id !== reading.id),
      window: session.window,
      allow: READING_TYPES as unknown as ReadingType[],
    });
    const echoed = (judgment.echoes[reading.id]?.noul ?? 0) >= 0.78 || reading.mark === "echo";
    const mark = composeMark({
      judgment,
      echoed,
      split: liveIsSplit(open, reading.windowStartedMs),
      hasWindowFacts: Boolean(session.window.facts.trim()),
      hold: false,
    });
    next.push({ ...reading, mark, lastJudgment: judgment });
  }
  return { ...session, live: next };
}
