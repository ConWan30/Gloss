import type { LineClass, PulseJudgment, Reading, ReadingType } from "../types.ts";
import { READING_TYPES } from "../types.ts";

const TYPE_KEYS: ReadingType[] = [...READING_TYPES];

function peaked(choice: string, keys: string[], mass = 0.82): Record<string, number> {
  const rest = (1 - mass) / Math.max(1, keys.length - 1);
  return Object.fromEntries(keys.map((k) => [k, k === choice ? mass : rest]));
}

function classify(text: string): LineClass {
  const t = text.toLowerCase();
  if (/\b(ban|timeout|mod)\b/.test(t)) return "report";
  if (/\?/.test(t)) return "question";
  if (/\b(lul|lol|kek|kappa|jebaited)\b/.test(t)) return "joke";
  if (
    /\b(bait|threw|throw|collapse|outplay|clipped|clip that|promise|if i die|offside|travel)\b/.test(
      t,
    )
  ) {
    return "claim";
  }
  if (
    /\b(lead|leads|score|down and|and \d|quarter|q[1-4]|1st|2nd|3rd|4th)\b/.test(t) ||
    /\b\d+\s*[-\u2013]\s*\d+\b/.test(t)
  ) {
    return "claim";
  }
  if (t.split(/\s+/).length <= 2) return "unbound";
  return "unbound";
}

function guessType(text: string): ReadingType {
  const t = text.toLowerCase();
  if (/\bbait|fake|sell\b/.test(t)) return "bait";
  if (/\bthrew|throw|collapse|int|choke\b/.test(t)) return "collapse";
  if (/\boutplay|insane|clean\b/.test(t)) return "outplay";
  if (/\boffside|travel|foul|illegal|rule\b/.test(t)) return "rule";
  if (/\bpromise|if i|gift|sub\b/.test(t)) return "promise";
  if (/\bclip\b/.test(t)) return "clip";
  if (
    /\b(lead|leads|score|down and|quarter|q[1-4]|1st|2nd|3rd|4th)\b/.test(t) ||
    /\b\d+\s*[-\u2013]\s*\d+\b/.test(t)
  ) {
    return "state";
  }
  return "theory";
}

export function fixtureJudge(input: {
  text: string;
  live: Reading[];
  windowFacts: string;
}): PulseJudgment {
  const lineClass = classify(input.text);
  const type = guessType(input.text);
  const classKeys = ["claim", "joke", "question", "report", "unbound"];
  const echoes: PulseJudgment["echoes"] = {};

  for (const reading of input.live) {
    const sameType = reading.type === type && lineClass === "claim";
    const overlap = reading.label
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && input.text.toLowerCase().includes(w)).length;
    const noul = sameType && overlap >= 1 ? 0.88 : sameType ? 0.41 : 0.08;
    echoes[reading.id] = { noul };
  }

  const echoed = Object.values(echoes).some((e) => e.noul >= 0.78);
  const facts = input.windowFacts.trim();
  const supports =
    lineClass === "claim" && facts && /support|yes|holds/i.test(facts) ? 0.8 : facts ? 0.22 : 0.12;
  const contradicts =
    lineClass === "claim" && facts && /contradict|no|conflict/i.test(facts) ? 0.8 : 0.14;
  const thin = lineClass === "claim" && !facts ? 0.74 : lineClass === "claim" ? 0.28 : 0.1;

  return {
    modelVersion: "fixture-0.1",
    lineClass: {
      choice: lineClass,
      confidence: 0.8,
      probabilities: peaked(lineClass, classKeys),
    },
    type: {
      choice: type,
      confidence: 0.76,
      probabilities: peaked(type, TYPE_KEYS),
    },
    worthOpening: { noul: lineClass === "claim" && !echoed ? 0.84 : 0.11 },
    supports: { noul: supports },
    contradicts: { noul: contradicts },
    thin: { noul: thin },
    echoes,
  };
}
