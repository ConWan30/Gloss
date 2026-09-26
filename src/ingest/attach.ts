import type { SessionState } from "../types.ts";

export function attachTape(
  session: SessionState,
  body: { fresh?: unknown },
): "open" | "keep" {
  if (body.fresh === true) return "open";
  if (session.closedMs != null) return "open";
  return "keep";
}
