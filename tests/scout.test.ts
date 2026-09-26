import { test } from "node:test";
import assert from "node:assert/strict";
import { scoutBurst } from "../src/ingest/scout.ts";
import { THRESHOLDS, type SessionState } from "../src/types.ts";

test("Jev scouts a burst and opens claims only", async () => {
  const session: SessionState = {
    id: "s",
    channel: "local",
    startedMs: 1,
    closedMs: null,
    window: { startedMs: 1, lengthMs: THRESHOLDS.windowMs, facts: "", streamerUtterance: "" },
    live: [],
    folio: [],
  };
  const raw = ["LUL", "kek", "that rotate was a bait they sold mid", "?"].join("\n");
  const { session: next, scouted } = await scoutBurst(session, raw, "chat");
  assert.equal(scouted, 4);
  assert.ok(next.live.length >= 1);
  assert.ok(next.live.length <= 3);
  assert.equal(next.live.some((r) => r.mark === "hold"), false);
  assert.ok(next.live.some((r) => /bait|sold|rotate/i.test(r.label)));
});
