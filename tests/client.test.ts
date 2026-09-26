import { test } from "node:test";
import assert from "node:assert/strict";
import { judgeLine } from "../src/jev/client.ts";
import { judgeStatus } from "../src/jev/status.ts";
import type { Line } from "../src/types.ts";

const line: Line = {
  id: "l",
  sessionId: "s",
  clockMs: 1,
  user: "bo",
  text: "LUL",
};

test("unset key stays fixture and drops jokes", async () => {
  delete process.env.TYPESAFE_API_KEY;
  const judgment = await judgeLine({
    line,
    live: [],
    window: { startedMs: 1, lengthMs: 12_000, facts: "", streamerUtterance: "" },
    allow: ["outplay", "collapse", "bait", "rule", "promise", "clip", "theory"],
  });
  assert.equal(judgment.lineClass.choice, "joke");
  assert.equal(judgeStatus().mode, "fixture");
});
