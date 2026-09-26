import { test } from "node:test";
import assert from "node:assert/strict";
import { attachTape } from "../src/ingest/attach.ts";
import { THRESHOLDS, type SessionState } from "../src/types.ts";

function open(): SessionState {
  return {
    id: "s",
    channel: "x",
    startedMs: 1,
    closedMs: null,
    window: { startedMs: 1, lengthMs: THRESHOLDS.windowMs, facts: "", streamerUtterance: "" },
    live: [],
    folio: [],
  };
}

test("open session keeps the tape", () => {
  assert.equal(attachTape(open(), {}), "keep");
});

test("closed or fresh opens a new tape", () => {
  assert.equal(attachTape({ ...open(), closedMs: 9 }, {}), "open");
  assert.equal(attachTape(open(), { fresh: true }), "open");
});
