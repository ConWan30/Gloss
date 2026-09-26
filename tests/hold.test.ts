import { test } from "node:test";
import assert from "node:assert/strict";
import { applyPulse } from "../src/compose/pulse.ts";
import { restampLive } from "../src/compose/restamp.ts";
import { fixtureJudge } from "../src/jev/fixtures.ts";
import { THRESHOLDS, type Line, type SessionState } from "../src/types.ts";

test("hold is not restamped off the rail", async () => {
  let session: SessionState = {
    id: "s",
    channel: "local",
    startedMs: 1,
    closedMs: null,
    window: {
      startedMs: 1,
      lengthMs: THRESHOLDS.windowMs,
      facts: "",
      streamerUtterance: "",
    },
    live: [],
    folio: [],
  };
  const line: Line = {
    id: "l1",
    sessionId: "s",
    clockMs: 1,
    user: "bo",
    text: "he threw the round completely",
  };
  session = applyPulse(
    session,
    line,
    fixtureJudge({ text: line.text, live: [], windowFacts: "" }),
  );
  session = {
    ...session,
    live: session.live.map((r) => ({ ...r, mark: "hold" })),
    window: { ...session.window, facts: "support holds" },
  };
  session = await restampLive(session);
  assert.equal(session.live[0]?.mark, "hold");
});
