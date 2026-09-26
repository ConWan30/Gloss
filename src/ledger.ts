import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Line, Reading, SessionState, WindowDescriptor } from "./types.ts";
import { THRESHOLDS } from "./types.ts";

export class Ledger {
  private db: DatabaseSync;

  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        channel TEXT NOT NULL,
        started_ms INTEGER NOT NULL,
        closed_ms INTEGER,
        window_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS lines (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        clock_ms INTEGER NOT NULL,
        user TEXT NOT NULL,
        text TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS readings (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        payload TEXT NOT NULL
      );
    `);
  }

  openSession(channel: string, startedMs = Date.now()): SessionState {
    const id = crypto.randomUUID();
    const window: WindowDescriptor = {
      startedMs,
      lengthMs: THRESHOLDS.windowMs,
      facts: "",
      streamerUtterance: "",
      citation: null,
    };
    this.db
      .prepare(
        "INSERT INTO sessions (id, channel, started_ms, closed_ms, window_json) VALUES (?, ?, ?, NULL, ?)",
      )
      .run(id, channel, startedMs, JSON.stringify({ glass: false, window }));
    return {
      id,
      channel,
      startedMs,
      closedMs: null,
      glass: false,
      window,
      live: [],
      folio: [],
    };
  }

  save(session: SessionState, line?: Line) {
    this.db
      .prepare("UPDATE sessions SET closed_ms = ?, window_json = ? WHERE id = ?")
      .run(
        session.closedMs,
        JSON.stringify({ glass: session.glass === true, window: session.window }),
        session.id,
      );
    if (line) {
      this.db
        .prepare(
          "INSERT OR REPLACE INTO lines (id, session_id, clock_ms, user, text) VALUES (?, ?, ?, ?, ?)",
        )
        .run(line.id, line.sessionId, line.clockMs, line.user, line.text);
    }
    const put = this.db.prepare(
      "INSERT OR REPLACE INTO readings (id, session_id, payload) VALUES (?, ?, ?)",
    );
    for (const reading of [...session.live, ...session.folio]) {
      put.run(reading.id, reading.sessionId, JSON.stringify(reading));
    }
  }

  load(sessionId: string): SessionState | null {
    const row = this.db
      .prepare("SELECT * FROM sessions WHERE id = ?")
      .get(sessionId) as
      | {
          id: string;
          channel: string;
          started_ms: number;
          closed_ms: number | null;
          window_json: string;
        }
      | undefined;
    if (!row) return null;
    const readings = this.db
      .prepare("SELECT payload FROM readings WHERE session_id = ?")
      .all(sessionId) as { payload: string }[];
    const all = readings.map((r) => JSON.parse(r.payload) as Reading);
    const stored = JSON.parse(row.window_json) as
      | WindowDescriptor
      | { glass?: boolean; window?: WindowDescriptor };
    const wrapped = stored && "window" in stored && stored.window ? stored : null;
    return {
      id: row.id,
      channel: row.channel,
      startedMs: row.started_ms,
      closedMs: row.closed_ms,
      glass: wrapped ? wrapped.glass === true : false,
      window: (wrapped ? wrapped.window : stored) as WindowDescriptor,
      live: all.filter((r) => r.mark !== "closed"),
      folio: all.filter((r) => r.mark === "closed" || r.type === "promise"),
    };
  }

  latest(): SessionState | null {
    const row = this.db
      .prepare("SELECT id FROM sessions ORDER BY started_ms DESC LIMIT 1")
      .get() as { id: string } | undefined;
    return row ? this.load(row.id) : null;
  }
}
