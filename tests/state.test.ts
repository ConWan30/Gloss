import { test } from "node:test";
import assert from "node:assert/strict";
import { buildState } from "../src/jev/questions.ts";

test("judge state has no citation", () => {
  const state = buildState({
    line: { text: "they threw mid", user: "bo" },
    live: [],
    window: {
      startedMs: 1,
      lengthMs: 12_000,
      facts: "support holds",
      streamerUtterance: "",
      citation: { clock_ns: "1700000000000", frame_seq: 12 },
    },
  });
  assert.equal("citation" in state.window, false);
  assert.equal(JSON.stringify(state).includes("clock_ns"), false);
});
