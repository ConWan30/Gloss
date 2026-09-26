import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyPulse, closeSession } from "../src/compose/pulse.ts";
import { fixtureJudge } from "../src/jev/fixtures.ts";
import { Ledger } from "../src/ledger.ts";
import { folioView } from "../src/folio.ts";
import type { Line } from "../src/types.ts";

test("folio survives a new session", () => {
  const db = join(mkdtempSync(join(tmpdir(), "gloss-")), "g.db");
  const ledger = new Ledger(db);
  let session = ledger.openSession("x", 1);
  const line: Line = {
    id: "l1",
    sessionId: session.id,
    clockMs: 2,
    user: "bo",
    text: "he threw the round completely",
  };
  session = applyPulse(
    session,
    line,
    fixtureJudge({ text: line.text, live: [], windowFacts: "" }),
  );
  session = closeSession(session, 3);
  ledger.save(session, line);
  assert.ok(session.folio.length >= 1);

  const next = ledger.openSession("x", 4);
  ledger.save(next);
  const closed = ledger.lastClosed();
  assert.ok(closed);
  const view = folioView(closed);
  assert.ok(view.folio.some((r) => r.label.includes("threw")));
  assert.equal(next.folio.length, 0);
});

test("closed hold lands in folio and empty close does not hide it", () => {
  const db = join(mkdtempSync(join(tmpdir(), "gloss-")), "g.db");
  const ledger = new Ledger(db);
  let session = ledger.openSession("x", 1);
  session.window = {
    ...session.window,
    citation: { clock_ns: "1700000000000", frame_seq: 12 },
  };
  session.glass = true;
  const line: Line = {
    id: "l1",
    sessionId: session.id,
    clockMs: 2,
    user: "bo",
    text: "he threw the round completely",
  };
  session = applyPulse(
    session,
    line,
    fixtureJudge({ text: line.text, live: [], windowFacts: "" }),
  );
  session = {
    ...session,
    live: session.live.map((r) => ({ ...r, mark: "hold" })),
  };
  session = closeSession(session, 3);
  ledger.save(session, line);

  const empty = ledger.openSession("local", 4);
  const closedEmpty = { ...empty, closedMs: 5 };
  ledger.save(closedEmpty);

  const closed = ledger.lastClosed();
  assert.ok(closed);
  assert.ok(closed.folio.some((r) => r.mark === "hold"));
  assert.equal(closed.live.length, 0);
  const view = folioView(closed);
  assert.equal(view.citation?.frame_seq, 12);
  assert.ok(view.folio.some((r) => r.mark === "hold"));
});
