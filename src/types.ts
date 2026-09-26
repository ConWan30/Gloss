export const READING_TYPES = [
  "outplay",
  "collapse",
  "bait",
  "rule",
  "promise",
  "clip",
  "state",
  "theory",
] as const;

export type ReadingType = (typeof READING_TYPES)[number];

export const MARKS = [
  "open",
  "bound",
  "thin",
  "split",
  "clash",
  "echo",
  "closed",
  "hold",
] as const;

export type Mark = (typeof MARKS)[number];

export const LINE_CLASSES = [
  "claim",
  "joke",
  "question",
  "report",
  "unbound",
] as const;

export type LineClass = (typeof LINE_CLASSES)[number];

export type Line = {
  id: string;
  sessionId: string;
  clockMs: number;
  user: string;
  text: string;
};

export type GlassCitation = {
  clock_ns: string;
  frame_seq: number;
};

export type WindowDescriptor = {
  startedMs: number;
  lengthMs: number;
  facts: string;
  streamerUtterance: string;
  citation?: GlassCitation | null;
};

export type ChoiceVector = {
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
};

export type NoulVector = {
  noul: number;
};

export type PulseJudgment = {
  modelVersion: string;
  lineClass: ChoiceVector;
  type: ChoiceVector;
  worthOpening: NoulVector;
  supports: NoulVector;
  contradicts: NoulVector;
  thin: NoulVector;
  echoes: Record<string, NoulVector>;
};

export type Reading = {
  id: string;
  sessionId: string;
  label: string;
  type: ReadingType;
  mark: Mark;
  windowStartedMs: number;
  openedMs: number;
  closedMs: number | null;
  echoOf: string | null;
  concentration: number;
  lineIds: string[];
  lastJudgment: PulseJudgment | null;
};

export type SessionState = {
  id: string;
  channel: string;
  startedMs: number;
  closedMs: number | null;
  glass?: boolean;
  window: WindowDescriptor;
  live: Reading[];
  folio: Reading[];
};

export const THRESHOLDS = {
  echo: 0.78,
  worthOpening: 0.62,
  supportHigh: 0.72,
  contradictHigh: 0.72,
  thinHigh: 0.65,
  maxLive: 3,
  windowMs: 12_000,
  recentLineCap: 40,
} as const;
