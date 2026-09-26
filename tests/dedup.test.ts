import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJsonl, postsToLines } from "../src/ingest/x.ts";
import { pulseLines } from "../src/ingest/run.ts";
import { THRESHOLDS, type SessionState } from "../src/types.ts";

test("same post ids do not pulse twice", async () => {
  const session: SessionState = {
    id: "s",
    channel: "x",
    startedMs: 1,
    closedMs: null,
    window: { startedMs: 1, lengthMs: THRESHOLDS.windowMs, facts: "", streamerUtterance: "" },
    live: [],
    folio: [],
  };
  const posts = parseJsonl(
    '{"id":"1","user":"bo","createdMs":1,"text":"that rotate was a bait they sold mid"}',
  );
  const lines = postsToLines(posts, session.id);
  const once = await pulseLines(session, lines);
  const twice = await pulseLines(once, lines);
  assert.equal(once.live[0]?.lineIds.length, twice.live[0]?.lineIds.length);
  assert.equal(once.live[0]?.concentration, twice.live[0]?.concentration);
});
