import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extractStamp, parseQoresenceStamp } from "../src/cite.ts";

test("Qoresence fixture cites when same_seq is true", () => {
  const raw = JSON.parse(
    readFileSync(new URL("../fixtures/qoresence-window.json", import.meta.url), "utf8"),
  );
  const stamp = parseQoresenceStamp(extractStamp(raw));
  assert.deepEqual(stamp, { clock_ns: "1700000000000", frame_seq: 12 });
});

test("same_seq false is fail-closed", () => {
  assert.equal(
    parseQoresenceStamp({ clock_ns: "1700000000000", frame_seq: 12, same_seq: false }),
    null,
  );
});

test("nested seqgate envelope is accepted", () => {
  const stamp = parseQoresenceStamp(
    extractStamp({
      session_id: "q",
      seqgate: { clock_ns: "1700000000000", frame_seq: 4, same_seq: true },
    }),
  );
  assert.deepEqual(stamp, { clock_ns: "1700000000000", frame_seq: 4 });
});
