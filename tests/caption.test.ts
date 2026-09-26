import { test } from "node:test";
import assert from "node:assert/strict";
import { captionView } from "../src/caption.ts";
import { THRESHOLDS, type SessionState } from "../src/types.ts";

function session(mark: "open" | "hold"): SessionState {
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
      mark,
      windowStartedMs: 1,
      openedMs: 1,
      closedMs: null,
      echoOf: null,
      concentration: 0.2,
      lineIds: ["l1"],
      lastJudgment: null,
    }],
    folio: [],
  };
}

test("caption is empty without a hold", () => {
  assert.equal(captionView(session("open")).caption, null);
});

test("caption is the held reading", () => {
  const view = captionView(session("hold"));
  assert.equal(view.caption?.label, "threw the round");
  assert.equal(view.caption?.mark, "hold");
});
