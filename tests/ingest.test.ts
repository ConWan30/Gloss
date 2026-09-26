import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJsonl, postsToLines, normalizeText } from "../src/ingest/x.ts";
import { pulseLines } from "../src/ingest/run.ts";
import { THRESHOLDS, type SessionState } from "../src/types.ts";

test("X posts become lines in clock order without urls or handles", () => {
  const posts = parseJsonl(
    [
      '{"id":"b","user":"@cass","createdMs":2,"text":"bait mid https://x.com/x"}',
      '{"id":"a","user":"bo","createdMs":1,"text":"that rotate was a bait they sold mid"}',
    ].join("\n"),
  );
  const lines = postsToLines(posts, "s");
  assert.equal(lines[0].id, "a");
  assert.equal(lines[1].user, "cass");
  assert.equal(normalizeText("bait mid https://x.com/x"), "bait mid");
  assert.equal(lines[1].text.includes("https"), false);
});

test("X tape pulses into a capped rail", async () => {
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
    [
      '{"id":"1","user":"bo","createdMs":1,"text":"that rotate was a bait they sold mid"}',
      '{"id":"2","user":"cass","createdMs":2,"text":"bait mid they sold that rotate"}',
      '{"id":"3","user":"dre","createdMs":3,"text":"he threw the round completely"}',
      '{"id":"4","user":"gia","createdMs":4,"text":"insane outplay on the parry"}',
      '{"id":"5","user":"hex","createdMs":5,"text":"offside no call that is a rule"}',
    ].join("\n"),
  );
  const next = await pulseLines(session, postsToLines(posts, session.id));
  const live = next.live.filter((r) => r.mark !== "closed");
  assert.ok(live.length <= 3);
  assert.equal(live.some((r) => r.mark === "echo" || r.lineIds.length > 1), true);
});
