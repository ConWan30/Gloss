import type { Reading, ReadingType, WindowDescriptor } from "../types.ts";
import { READING_TYPES } from "../types.ts";

export type QuestionPack = {
  lineClass: Record<string, unknown>;
  type: Record<string, unknown>;
  worthOpening: Record<string, unknown>;
  supports: Record<string, unknown>;
  contradicts: Record<string, unknown>;
  thin: Record<string, unknown>;
  [echoKey: `echo_${string}`]: Record<string, unknown>;
};

export function buildQuestions(input: {
  live: Reading[];
  allow: ReadingType[];
}): QuestionPack {
  const types = Object.fromEntries(
    (input.allow.length ? input.allow : [...READING_TYPES]).map((t) => [
      t,
      `The allegation is of type ${t}.`,
    ]),
  );

  const pack: QuestionPack = {
    lineClass: {
      type: "choice",
      instructions:
        "Classify `line.text` as one closed class. A claim alleges something about the current window of tape. A joke does not. A question asks. A report flags a person or rule break for mods. Unbound is none of those.",
      criteria: {
        claim: "Alleges a fact or reading about the live window.",
        joke: "Play, meme, or empty reaction with no allegation.",
        question: "Asks the streamer or room something.",
        report: "Calls for a mod, ban, or rule enforcement on a person.",
        unbound: "Does not attach to the tape or the room's allegation.",
      },
    },
    type: {
      type: "choice",
      instructions:
        "If `line.text` is a claim, pick its type. If it is not a claim, still pick the closest type; compose will ignore it when class is not claim.",
      criteria: types,
    },
    worthOpening: {
      type: "noul",
      instructions:
        "Should this line open a new live reading? True only if it is a distinct allegation and none of `live[]` already holds it.",
      criteria: {
        true: "New allegation, not an echo of a live reading, worth a slot.",
        false: "Noise, echo, or not an allegation.",
      },
    },
    supports: {
      type: "noul",
      instructions:
        "Does `window.facts` plus `window.streamerUtterance` support the allegation in `line.text`?",
      criteria: {
        true: "The window descriptor backs the allegation.",
        false: "The window is silent, missing, or does not back it.",
      },
    },
    contradicts: {
      type: "noul",
      instructions:
        "Does `window.facts` plus `window.streamerUtterance` contradict the allegation in `line.text`?",
      criteria: {
        true: "The window descriptor conflicts with the allegation.",
        false: "No conflict, or no window facts to conflict with.",
      },
    },
    thin: {
      type: "noul",
      instructions:
        "Is the allegation thinner than the evidence in this window? Thin means the claim outruns what the window can show.",
      criteria: {
        true: "Allegation outruns the window.",
        false: "Allegation is sized to the window, or there is no allegation.",
      },
    },
  };

  for (const reading of input.live) {
    pack[`echo_${reading.id}`] = {
      type: "noul",
      instructions: `Is \`line.text\` the same allegation as live reading ${reading.id} labeled "${reading.label}" (${reading.type}), even if the wording differs?`,
      criteria: {
        true: "Same allegation, new words.",
        false: "A different allegation, or not an allegation.",
      },
    };
  }

  return pack;
}

export function buildState(input: {
  line: { text: string; user: string };
  live: Reading[];
  window: WindowDescriptor;
}) {
  return {
    line: input.line,
    live: input.live.map((r) => ({
      id: r.id,
      label: r.label,
      type: r.type,
      mark: r.mark,
    })),
    window: input.window,
  };
}
