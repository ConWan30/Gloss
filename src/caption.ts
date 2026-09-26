import { publicCitation } from "./glass.ts";
import type { SessionState } from "./types.ts";

export function captionView(session: SessionState | null) {
  const held = session?.live.find((r) => r.mark === "hold") ?? null;
  return {
    sessionId: session?.id ?? null,
    citation: session
      ? publicCitation(session.glass === true, session.window.citation ?? null)
      : null,
    caption: held
      ? { id: held.id, label: held.label, type: held.type, mark: held.mark }
      : null,
  };
}
