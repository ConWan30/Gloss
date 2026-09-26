import { fixtureJudge } from "./fixtures.ts";
import { buildQuestions, buildState } from "./questions.ts";
import { noteLiveFail, noteLiveOk } from "./status.ts";
import type { Line, PulseJudgment, Reading, ReadingType, WindowDescriptor } from "../types.ts";

const MODEL = process.env.GLOSS_MODEL ?? "jev-latest";
const ENDPOINT = "https://api.typesafe.ai/v1/systemone";

type RawAnswer = {
  type?: string;
  choice?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
  noul?: number;
};

function noulOf(answer: RawAnswer | undefined): { noul: number } {
  const n = typeof answer?.noul === "number" ? answer.noul : 0;
  return { noul: n };
}

function choiceOf(
  answer: RawAnswer | undefined,
  fallback: string,
): PulseJudgment["lineClass"] {
  return {
    choice: answer?.choice ?? fallback,
    confidence: answer?.confidence ?? 0,
    probabilities: answer?.probabilities ?? { [fallback]: 1 },
  };
}

export async function judgeLine(input: {
  line: Line;
  live: Reading[];
  window: WindowDescriptor;
  allow: ReadingType[];
}): Promise<PulseJudgment> {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key || process.env.NODE_TEST_CONTEXT) {
    return fixtureJudge({
      text: input.line.text,
      live: input.live,
      windowFacts: input.window.facts,
    });
  }

  const state = buildState({
    line: { text: input.line.text, user: input.line.user },
    live: input.live,
    window: input.window,
  });
  const questions = buildQuestions({ live: input.live, allow: input.allow });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        state,
        questions,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    noteLiveFail(err instanceof Error ? err.message : "network");
    return fixtureJudge({
      text: input.line.text,
      live: input.live,
      windowFacts: input.window.facts,
    });
  }
  clearTimeout(timer);

  if (!response.ok) {
    const body = await response.text();
    noteLiveFail(`TypeSafe ${response.status}: ${body.slice(0, 180)}`);
    return fixtureJudge({
      text: input.line.text,
      live: input.live,
      windowFacts: input.window.facts,
    });
  }

  const payload = (await response.json()) as {
    model?: string;
    answers?: Record<string, RawAnswer>;
  };
  noteLiveOk();
  const answers = payload.answers ?? {};
  const echoes: PulseJudgment["echoes"] = {};
  for (const reading of input.live) {
    echoes[reading.id] = noulOf(answers[`echo_${reading.id}`]);
  }

  return {
    modelVersion: payload.model ?? MODEL,
    lineClass: choiceOf(answers.lineClass, "unbound"),
    type: choiceOf(answers.type, "theory"),
    worthOpening: noulOf(answers.worthOpening),
    supports: noulOf(answers.supports),
    contradicts: noulOf(answers.contradicts),
    thin: noulOf(answers.thin),
    echoes,
  };
}
