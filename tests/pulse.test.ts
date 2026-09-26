import { test } from "node:test";
import assert from "node:assert/strict";
import { applyPulse, closeSession } from "../src/compose/pulse.ts";
import { composeMark } from "../src/compose/marks.ts";
import { fixtureJudge } from "../src/jev/fixtures.ts";
import { spanLabel } from "../src/compose/label.ts";
import { THRESHOLDS, type SessionState, type Line } from "../src/types.ts";

function session(): SessionState {
  return {
    id: "s1",
    channel: "local",
    startedMs: 1,
    closedMs: null,
    window: { startedMs: 1, lengthMs: THRESHOLDS.windowMs, facts: "", streamerUtterance: "" },
    live: [],
    folio: [],
  };
}

function line(text: string, n = 1): Line {
  return { id: `l${n}`, sessionId: "s1", clockMs: n * 1000, user: "chat", text };
}

test("span labels stay short and do not invent prose", () => {
  const label = spanLabel("that rotate was a bait mid they sold the whole fight https://x.com/x");
  assert.ok(label.length <= 49);
  assert.equal(label.includes("https"), false);
});

test("support and contradiction both high compose Clash", () => {
  const mark = composeMark({
    judgment: fixtureJudge({ text: "they threw mid", live: [], windowFacts: "support contradict" }),
    echoed: false,
    split: false,
    hasWindowFacts: true,
    hold: false,
  });
  assert.equal(mark, "clash");
});

test("no window facts cannot Bound", () => {
  const mark = composeMark({
    judgment: fixtureJudge({ text: "they threw mid", live: [], windowFacts: "" }),
    echoed: false,
    split: false,
    hasWindowFacts: false,
    hold: false,
  });
  assert.notEqual(mark, "bound");
});

test("jokes do not open a reading", () => {
  const next = applyPulse(session(), line("LUL"), fixtureJudge({ text: "LUL", live: [], windowFacts: "" }));
  assert.equal(next.live.length, 0);
});

test("claims cap at three live readings", () => {
  let s = session();
  const claims = [
    "that was a bait mid they sold it",
    "he threw the round completely",
    "insane outplay on the parry",
    "if i die i gift ten subs promise",
  ];
  claims.forEach((text, i) => {
    const l = line(text, i + 1);
    s = applyPulse(s, l, fixtureJudge({ text, live: s.live, windowFacts: "" }));
  });
  const live = s.live.filter((r) => r.mark !== "closed");
  assert.ok(live.length <= 3, `live=${live.length}`);
});

test("paraphrase attaches as echo instead of a fourth story", () => {
  let s = session();
  const first = "that rotate was a bait they sold mid";
  s = applyPulse(s, line(first, 1), fixtureJudge({ text: first, live: [], windowFacts: "" }));
  const second = "bait mid they sold that rotate";
  s = applyPulse(s, line(second, 2), fixtureJudge({ text: second, live: s.live, windowFacts: "" }));
  const live = s.live.filter((r) => r.mark !== "closed");
  assert.equal(live.length, 1);
  assert.equal(live[0].lineIds.length, 2);
  assert.equal(live[0].mark, "echo");
});

test("close session archives non-promises", () => {
  let s = session();
  const text = "that was a bait mid they sold it";
  s = applyPulse(s, line(text), fixtureJudge({ text, live: [], windowFacts: "" }));
  s = closeSession(s, 99);
  assert.equal(s.live.length, 0);
  assert.ok(s.folio.length >= 1);
  assert.equal(s.closedMs, 99);
});
