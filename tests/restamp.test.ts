import { test } from "node:test";
import assert from "node:assert/strict";
import { applyPulse } from "../src/compose/pulse.ts";
import { restampLive } from "../src/compose/restamp.ts";
import { fixtureJudge } from "../src/jev/fixtures.ts";
import { THRESHOLDS, type Line, type SessionState } from "../src/types.ts";

test("tapping window facts restamps a live claim to Bound", async () => {
  let session: SessionState = {
    id: "s",
    channel: "local",
    startedMs: 1,
    closedMs: null,
    glass: true,
    window: {
      startedMs: 1,
      lengthMs: THRESHOLDS.windowMs,
      facts: "",
      streamerUtterance: "",
      citation: null,
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
  assert.notEqual(session.live[0]?.mark, "bound");
  session = {
    ...session,
    window: { ...session.window, facts: "support holds" },
  };
  session = await restampLive(session);
  assert.equal(session.live[0]?.mark, "bound");
});
