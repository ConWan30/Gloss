import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCitation, publicCitation } from "../src/glass.ts";
import { composeMark } from "../src/compose/marks.ts";
import { fixtureJudge } from "../src/jev/fixtures.ts";

test("citation is fail-closed", () => {
  assert.equal(parseCitation({}), null);
  assert.equal(parseCitation({ clock_ns: "abc", frame_seq: 1 }), null);
  assert.equal(parseCitation({ clock_ns: "123", frame_seq: 1 }), null);
  assert.equal(parseCitation({ clock_ns: "1700000000000", frame_seq: -1 }), null);
  assert.deepEqual(parseCitation({ clock_ns: "1700000000000", frame_seq: "12" }), {
    clock_ns: "1700000000000",
    frame_seq: 12,
  });
});

test("glass off never publishes a citation", () => {
  const parsed = parseCitation({ clock_ns: "1700000000000", frame_seq: 4 });
  assert.equal(publicCitation(false, parsed), null);
  assert.deepEqual(publicCitation(true, parsed), parsed);
});

test("citation does not grant Bound", () => {
  const mark = composeMark({
    judgment: fixtureJudge({ text: "they threw mid", live: [], windowFacts: "" }),
    echoed: false,
    split: false,
    hasWindowFacts: false,
    hold: false,
  });
  assert.notEqual(mark, "bound");
});
