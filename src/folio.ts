import { publicCitation } from "./glass.ts";
import type { SessionState } from "./types.ts";

export function folioView(session: SessionState | null) {
  if (!session) {
    return {
      sessionId: null,
      channel: null,
      closedMs: null,
      citation: null,
      folio: [] as Array<{
        id: string;
        label: string;
        type: string;
        mark: string;
      }>,
    };
  }
  return {
    sessionId: session.id,
    channel: session.channel,
    closedMs: session.closedMs,
    citation: publicCitation(session.glass === true, session.window.citation ?? null),
    folio: session.folio.map((r) => ({
      id: r.id,
      label: r.label,
      type: r.type,
      mark: r.mark,
    })),
  };
}
