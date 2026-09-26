import { test } from "node:test";
import assert from "node:assert/strict";
import { applyPulse } from "../src/compose/pulse.ts";
import { fixtureJudge } from "../src/jev/fixtures.ts";
import { THRESHOLDS, type Line, type SessionState } from "../src/types.ts";

test("score and clock line opens a state claim", () => {
  const text =
    "Raiders lead 14-0 on fourth and nine with 1:47 left in the first.";
  const judgment = fixtureJudge({ text, live: [], windowFacts: "Raiders 14, Saints 0, 1st quarter, 1:47, 4th and 9" });
  assert.equal(judgment.lineClass.choice, "claim");
  assert.equal(judgment.type.choice, "state");
  assert.ok(judgment.worthOpening.noul >= THRESHOLDS.worthOpening);

  const session: SessionState = {
    id: "s",
    channel: "local",
    startedMs: 1,
    closedMs: null,
    window: {
      startedMs: 1,
      lengthMs: THRESHOLDS.windowMs,
      facts: "Raiders 14, Saints 0, 1st quarter, 1:47, 4th and 9",
      streamerUtterance: "",
    },
    live: [],
    folio: [],
  };
  const line: Line = {
    id: "l1",
    sessionId: "s",
    clockMs: 1,
    user: "chat",
    text,
  };
  const next = applyPulse(session, line, judgment);
  assert.equal(next.live.length, 1);
  assert.equal(next.live[0].type, "state");
});
