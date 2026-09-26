import { readFileSync } from "node:fs";
import { applyPulse, closeSession } from "./compose/pulse.ts";
import { fixtureJudge } from "./jev/fixtures.ts";
import { THRESHOLDS, type Line, type SessionState } from "./types.ts";

const path = process.argv[2] ?? "fixtures/ranked-session.jsonl";
const rows = readFileSync(path, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean)
  .map((l) => JSON.parse(l) as { user: string; text: string; facts?: string });

let session: SessionState = {
  id: "replay",
  channel: "replay",
  startedMs: 0,
  closedMs: null,
  window: { startedMs: 0, lengthMs: THRESHOLDS.windowMs, facts: "", streamerUtterance: "" },
  live: [],
  folio: [],
};

rows.forEach((row, i) => {
  if (row.facts !== undefined) {
    session = {
      ...session,
      window: { ...session.window, startedMs: i * 1000, facts: row.facts },
    };
  }
  const line: Line = {
    id: `r${i}`,
    sessionId: session.id,
    clockMs: i * 1000,
    user: row.user,
    text: row.text,
  };
  session = applyPulse(
    session,
    line,
    fixtureJudge({ text: row.text, live: session.live, windowFacts: session.window.facts }),
  );
});

session = closeSession(session, rows.length * 1000);
for (const r of session.folio) {
  console.log(`${r.mark.padEnd(8)} ${r.type.padEnd(9)} ${r.label}`);
}
console.log(`folio=${session.folio.length} live=${session.live.length}`);
