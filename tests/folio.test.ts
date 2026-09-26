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
