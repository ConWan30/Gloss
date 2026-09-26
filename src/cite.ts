import { parseCitation, type GlassCitation } from "./glass.ts";

export type QoresenceStamp = {
  clock_ns?: unknown;
  frame_seq?: unknown;
  same_seq?: unknown;
  session_id?: unknown;
};

export function extractStamp(raw: unknown): QoresenceStamp {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const layer =
    o.seqgate && typeof o.seqgate === "object"
      ? (o.seqgate as Record<string, unknown>)
      : o;
  return {
    clock_ns: layer.clock_ns ?? o.clock_ns,
    frame_seq: layer.frame_seq ?? o.frame_seq,
    same_seq: layer.same_seq ?? o.same_seq,
    session_id: o.session_id ?? layer.session_id,
  };
}

export function parseQoresenceStamp(input: QoresenceStamp): GlassCitation | null {
  if (input.same_seq === false || input.same_seq === "false") return null;
  if (
    Object.prototype.hasOwnProperty.call(input, "same_seq") &&
    input.same_seq !== true &&
    input.same_seq !== "true" &&
    input.same_seq !== undefined
  ) {
    return null;
  }
  return parseCitation(input);
}
