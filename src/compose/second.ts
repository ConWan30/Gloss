import type { SessionState } from "../types.ts";

export function applySecond(
  session: SessionState,
  readingId: string,
  lineId: string,
): SessionState {
  const target = session.live.find((r) => r.id === readingId && r.mark !== "closed");
  if (!target) return session;
  return {
    ...session,
    live: session.live.map((r) => {
      if (r.id !== readingId) return r;
      if (r.lineIds.includes(lineId)) return r;
      return {
        ...r,
        lineIds: [...r.lineIds, lineId],
        concentration: Math.min(1, r.concentration + 1 / Math.max(8, r.lineIds.length + 4)),
      };
    }),
  };
}
