import { randomUUID } from "node:crypto";
import { spanLabel } from "./label.ts";
import { composeMark, liveIsSplit, weakestLive } from "./marks.ts";
import { THRESHOLDS, type Line, type Reading, type ReadingType, type SessionState } from "../types.ts";

export function applyPulse(
  session: SessionState,
  line: Line,
  judgment: Awaited<ReturnType<typeof import("../jev/client.ts").judgeLine>>,
): SessionState {
  const live = session.live.filter((r) => r.mark !== "closed");
  const isClaim = judgment.lineClass.choice === "claim";

  if (!isClaim) {
    return { ...session, live };
  }

  const echoHit = live.find((r) => (judgment.echoes[r.id]?.noul ?? 0) >= THRESHOLDS.echo);

  if (echoHit) {
    const next = live.map((r) => {
      if (r.id !== echoHit.id) return r;
      const lineIds = r.lineIds.includes(line.id) ? r.lineIds : [...r.lineIds, line.id];
      const concentration = Math.min(1, r.concentration + 1 / Math.max(8, lineIds.length + 4));
      const mark = composeMark({
        judgment,
        echoed: true,
        split: liveIsSplit(live, r.windowStartedMs),
        hasWindowFacts: Boolean(session.window.facts.trim()),
        hold: r.mark === "hold",
      });
      return {
        ...r,
        mark,
        concentration,
        lineIds,
        lastJudgment: judgment,
      };
    });
    return { ...session, live: next };
  }

  if (judgment.worthOpening.noul < THRESHOLDS.worthOpening) {
    return { ...session, live };
  }

  const type = (judgment.type.choice as ReadingType) || "theory";
  const created: Reading = {
    id: randomUUID(),
    sessionId: session.id,
    label: spanLabel(line.text),
    type,
    mark: "open",
    windowStartedMs: session.window.startedMs,
    openedMs: line.clockMs,
    closedMs: null,
    echoOf: null,
    concentration: 1 / 8,
    lineIds: [line.id],
    lastJudgment: judgment,
  };
  created.mark = composeMark({
    judgment,
    echoed: false,
    split: liveIsSplit([...live, created], session.window.startedMs),
    hasWindowFacts: Boolean(session.window.facts.trim()),
    hold: false,
  });

  let nextLive = [...live, created];
  if (nextLive.length > THRESHOLDS.maxLive) {
    const drop = weakestLive(live);
    if (drop) {
      nextLive = nextLive
        .filter((r) => r.id !== drop.id)
        .concat([
          {
            ...drop,
            mark: drop.type === "promise" ? drop.mark : "closed",
            closedMs: drop.type === "promise" ? drop.closedMs : line.clockMs,
          },
        ]);
      const still = nextLive.filter((r) => r.mark !== "closed");
      const closed = nextLive.filter((r) => r.mark === "closed");
      nextLive = [...still.slice(0, THRESHOLDS.maxLive), ...closed];
    }
  }

  const openLive = nextLive.filter((r) => r.mark !== "closed");
  const folioAdd = nextLive.filter((r) => r.mark === "closed");
  const split = liveIsSplit(openLive, session.window.startedMs);
  const stamped = openLive.map((r) =>
    r.windowStartedMs === session.window.startedMs && split && r.mark !== "hold" && r.mark !== "clash"
      ? { ...r, mark: r.mark === "thin" || r.mark === "bound" ? r.mark : "split" }
      : r,
  );

  return {
    ...session,
    live: stamped,
    folio: [...session.folio, ...folioAdd.filter((r) => !session.folio.some((f) => f.id === r.id))],
  };
}

export function closeSession(session: SessionState, atMs: number): SessionState {
  const moved = session.live.map((r) =>
    r.type === "promise" && r.mark !== "hold"
      ? r
      : { ...r, mark: r.mark === "hold" ? "hold" : "closed", closedMs: r.closedMs ?? atMs },
  );
  return {
    ...session,
    closedMs: atMs,
    live: moved.filter((r) => r.type === "promise" && r.mark !== "closed"),
    folio: [
      ...session.folio,
      ...moved.filter((r) => !session.folio.some((f) => f.id === r.id)),
    ],
  };
}
