import { THRESHOLDS, type Mark, type PulseJudgment, type Reading } from "../types.ts";

export function composeMark(input: {
  judgment: PulseJudgment;
  echoed: boolean;
  split: boolean;
  hasWindowFacts: boolean;
  hold: boolean;
}): Mark {
  if (input.hold) return "hold";

  const support = input.judgment.supports.noul;
  const contradict = input.judgment.contradicts.noul;
  const thin = input.judgment.thin.noul;

  if (support >= THRESHOLDS.supportHigh && contradict >= THRESHOLDS.contradictHigh) {
    return "clash";
  }
  if (input.echoed) return "echo";
  if (thin >= THRESHOLDS.thinHigh) return "thin";
  if (input.split) return "split";
  if (
    input.hasWindowFacts &&
    support >= THRESHOLDS.supportHigh &&
    contradict < THRESHOLDS.contradictHigh
  ) {
    return "bound";
  }
  return "open";
}

export function liveIsSplit(live: Reading[], windowStartedMs: number): boolean {
  return live.filter((r) => r.mark !== "closed" && r.windowStartedMs === windowStartedMs).length >= 2;
}

export function weakestLive(live: Reading[]): Reading | null {
  if (!live.length) return null;
  const rank: Record<string, number> = {
    thin: 0,
    open: 1,
    echo: 2,
    split: 3,
    bound: 4,
    clash: 5,
    hold: 6,
    closed: 7,
  };
  return [...live].sort((a, b) => {
    const ra = rank[a.mark] ?? 1;
    const rb = rank[b.mark] ?? 1;
    if (ra !== rb) return ra - rb;
    return a.concentration - b.concentration;
  })[0];
}
