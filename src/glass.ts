export type GlassCitation = {
  clock_ns: string;
  frame_seq: number;
};

export function parseCitation(input: {
  clock_ns?: unknown;
  frame_seq?: unknown;
}): GlassCitation | null {
  const clock = String(input.clock_ns ?? "").trim();
  if (!/^\d{6,32}$/.test(clock)) return null;
  const raw = input.frame_seq;
  const frame =
    typeof raw === "number" ? raw : raw === undefined || raw === "" ? NaN : Number(raw);
  if (!Number.isInteger(frame) || frame < 0) return null;
  return { clock_ns: clock, frame_seq: frame };
}

export function publicCitation(
  glass: boolean,
  citation: GlassCitation | null,
): GlassCitation | null {
  if (!glass) return null;
  return citation;
}

export function emptyWindow(startedMs: number, lengthMs: number) {
  return {
    startedMs,
    lengthMs,
    facts: "",
    streamerUtterance: "",
    citation: null as GlassCitation | null,
  };
}
