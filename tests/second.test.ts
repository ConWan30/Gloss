import { test } from "node:test";
import assert from "node:assert/strict";
import { applySecond } from "../src/compose/second.ts";
import { THRESHOLDS, type SessionState } from "../src/types.ts";

function session(): SessionState {
  return {
    id: "s",
    channel: "local",
    startedMs: 1,
    closedMs: null,
    window: { startedMs: 1, lengthMs: THRESHOLDS.windowMs, facts: "", streamerUtterance: "" },
    live: [{
      id: "r1",
      sessionId: "s",
      label: "threw the round",
      type: "collapse",
      mark: "open",
      windowStartedMs: 1,
      openedMs: 1,
      closedMs: null,
      echoOf: null,
      concentration: 0.125,
      lineIds: ["l1"],
      lastJudgment: null,
    }],
    folio: [],
  };
}

test("second binds without opening a slot", () => {
  const next = applySecond(session(), "r1", "l2");
  assert.equal(next.live.length, 1);
  assert.deepEqual(next.live[0].lineIds, ["l1", "l2"]);
  assert.ok(next.live[0].concentration > 0.125);
  assert.equal(next.live[0].mark, "open");
});

test("unknown id is a no-op", () => {
  const start = session();
  const next = applySecond(start, "missing", "l2");
  assert.equal(next.live[0].lineIds.length, 1);
});
