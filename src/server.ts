import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join } from "node:path";
import { judgeLine } from "./jev/client.ts";
import { applyPulse, closeSession } from "./compose/pulse.ts";
import { applySecond } from "./compose/second.ts";
import { Ledger } from "./ledger.ts";
import { parseJsonl, postsToLines, type XPost } from "./ingest/x.ts";
import { pulseLines } from "./ingest/run.ts";
import { attachTape } from "./ingest/attach.ts";
import { parseCitation, publicCitation } from "./glass.ts";
import { extractStamp, parseQoresenceStamp } from "./cite.ts";
import { restampLive } from "./compose/restamp.ts";
import { judgeStatus } from "./jev/status.ts";
import { probeJev } from "./jev/probe.ts";
import { folioView } from "./folio.ts";
import { captionView } from "./caption.ts";
import { READING_TYPES, THRESHOLDS, type Line, type ReadingType, type SessionState } from "./types.ts";

const ROOT = join(import.meta.dirname, "..");

function loadEnv() {
  const path = join(ROOT, ".env");
  if (!existsSync(path)) return;
  for (const row of readFileSync(path, "utf8").split("\n")) {
    const line = row.trim();
    if (!line || line.startsWith("#")) continue;
    const cut = line.indexOf("=");
    if (cut < 1) continue;
    const key = line.slice(0, cut).trim();
    let value = line.slice(cut + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const PORT = Number(process.env.GLOSS_PORT ?? 8788);
const ledger = new Ledger(process.env.GLOSS_DB ?? join(ROOT, "data/gloss.db"));

let session: SessionState =
  ledger.latest() ?? ledger.openSession(process.env.GLOSS_CHANNEL ?? "local");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function json(res: import("node:http").ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function publicReading(r: SessionState["live"][number]) {
  return {
    id: r.id,
    label: r.label,
    type: r.type,
    mark: r.mark,
    concentration: Number(r.concentration.toFixed(3)),
    echoOf: r.echoOf,
    openedMs: r.openedMs,
    windowStartedMs: r.windowStartedMs,
  };
}

function publicView(s: SessionState) {
  const glass = s.glass === true;
  const citation = publicCitation(glass, s.window.citation ?? null);
  const status = judgeStatus();
  return {
    sessionId: s.id,
    channel: s.channel,
    closedMs: s.closedMs,
    glass,
    citation,
    window: {
      startedMs: s.window.startedMs,
      lengthMs: s.window.lengthMs,
      facts: s.window.facts,
      streamerUtterance: s.window.streamerUtterance,
    },
    live: s.live.slice(0, THRESHOLDS.maxLive).map(publicReading),
    folio: s.folio.map(publicReading),
    judge: status.mode,
    judgeError: status.error,
  };
}

async function readBody(req: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  try {
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/dock")) {
      res.writeHead(200, { "Content-Type": MIME[".html"] });
      res.end(readFileSync(join(ROOT, "public/dock.html")));
      return;
    }
    if (req.method === "GET" && url.pathname === "/rail") {
      res.writeHead(200, { "Content-Type": MIME[".html"] });
      res.end(readFileSync(join(ROOT, "public/rail.html")));
      return;
    }
    if (req.method === "GET" && url.pathname === "/folio") {
      res.writeHead(200, { "Content-Type": MIME[".html"] });
      res.end(readFileSync(join(ROOT, "public/folio.html")));
      return;
    }
    if (req.method === "GET" && url.pathname === "/caption") {
      res.writeHead(200, { "Content-Type": MIME[".html"] });
      res.end(readFileSync(join(ROOT, "public/caption.html")));
      return;
    }
    if (req.method === "GET" && url.pathname === "/second") {
      res.writeHead(200, { "Content-Type": MIME[".html"] });
      res.end(readFileSync(join(ROOT, "public/second.html")));
      return;
    }
    if (req.method === "GET" && url.pathname === "/v1/rail") {
      json(res, 200, publicView(session));
      return;
    }
    if (req.method === "GET" && url.pathname === "/v1/folio") {
      const closed = session.closedMs ? session : ledger.lastClosed();
      json(res, 200, folioView(closed));
      return;
    }
    if (req.method === "GET" && url.pathname === "/v1/caption") {
      json(res, 200, captionView(session));
      return;
    }
    if (req.method === "POST" && url.pathname === "/v1/jev/probe") {
      const result = await probeJev();
      json(res, 200, { ...publicView(session), probe: result });
      return;
    }
    if (req.method === "POST" && url.pathname === "/v1/cite") {
      const body = await readBody(req);
      let raw: unknown = body;
      if (body.fixture === "qoresence-window") {
        raw = JSON.parse(readFileSync(join(ROOT, "fixtures/qoresence-window.json"), "utf8"));
      } else if (body.pull === true) {
        const viewUrl = process.env.GLOSS_QORESENCE_VIEW ?? "";
        if (!viewUrl.startsWith("http://127.0.0.1") && !viewUrl.startsWith("http://localhost")) {
          json(res, 200, { ...publicView(session), cite: "no local view" });
          return;
        }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2_000);
        try {
          const pulled = await fetch(viewUrl, { signal: controller.signal });
          raw = await pulled.json();
        } catch {
          clearTimeout(timer);
          json(res, 200, { ...publicView(session), cite: "\u25a1" });
          return;
        }
        clearTimeout(timer);
      }
      const citation = parseQoresenceStamp(extractStamp(raw));
      session = {
        ...session,
        glass: citation ? true : session.glass,
        window: { ...session.window, citation },
      };
      ledger.save(session);
      json(res, 200, { ...publicView(session), cite: citation ? `f${citation.frame_seq}` : "\u25a1" });
      return;
    }
    if (req.method === "POST" && url.pathname === "/v1/session") {
      const body = await readBody(req);
      session = ledger.openSession(String(body.channel ?? session.channel));
      ledger.save(session);
      json(res, 200, publicView(session));
      return;
    }
    if (req.method === "POST" && url.pathname === "/v1/window") {
      const body = await readBody(req);
      session = {
        ...session,
        glass: typeof body.glass === "boolean" ? body.glass : body.on === true ? true : session.glass,
        window: {
          startedMs: Number(body.startedMs ?? Date.now()),
          lengthMs: Number(body.lengthMs ?? THRESHOLDS.windowMs),
          facts: String(body.facts ?? ""),
          streamerUtterance: String(body.streamerUtterance ?? ""),
          citation: parseCitation(body),
        },
      };
      session = await restampLive(session);
      ledger.save(session);
      json(res, 200, publicView(session));
      return;
    }
    if (req.method === "POST" && url.pathname === "/v1/glass") {
      const body = await readBody(req);
      session = { ...session, glass: body.on === true };
      ledger.save(session);
      json(res, 200, publicView(session));
      return;
    }
    if (req.method === "POST" && url.pathname === "/v1/line") {
      const body = await readBody(req);
      const line: Line = {
        id: crypto.randomUUID(),
        sessionId: session.id,
        clockMs: Number(body.clockMs ?? Date.now()),
        user: String(body.user ?? "anon"),
        text: String(body.text ?? "").slice(0, 280),
      };
      if (!line.text.trim()) {
        json(res, 400, { error: "empty line" });
        return;
      }
      const judgment = await judgeLine({
        line,
        live: session.live.filter((r) => r.mark !== "closed"),
        window: session.window,
        allow: READING_TYPES as unknown as ReadingType[],
      });
      session = applyPulse(session, line, judgment);
      ledger.save(session, line);
      json(res, 200, { ...publicView(session), lineId: line.id });
      return;
    }
    if (req.method === "POST" && url.pathname === "/v1/hold") {
      const body = await readBody(req);
      const id = String(body.id ?? "");
      session = {
        ...session,
        live: session.live.map((r) => (r.id === id ? { ...r, mark: "hold" } : r)),
      };
      ledger.save(session);
      json(res, 200, publicView(session));
      return;
    }
    if (req.method === "POST" && url.pathname === "/v1/second") {
      const body = await readBody(req);
      const id = String(body.id ?? "");
      const line: Line = {
        id: crypto.randomUUID(),
        sessionId: session.id,
        clockMs: Date.now(),
        user: String(body.user ?? "viewer").slice(0, 32),
        text: session.live.find((r) => r.id === id)?.label ?? "",
      };
      if (!id || !line.text) {
        json(res, 200, publicView(session));
        return;
      }
      session = applySecond(session, id, line.id);
      ledger.save(session, line);
      json(res, 200, publicView(session));
      return;
    }
    if (req.method === "POST" && url.pathname === "/v1/close") {
      session = closeSession(session, Date.now());
      ledger.save(session);
      json(res, 200, publicView(session));
      return;
    }
    if (req.method === "POST" && url.pathname === "/v1/ingest") {
      const body = await readBody(req);
      const fixtureName = String(body.fixture ?? "");
      const allowed = new Set(["x-session", "ranked-session"]);
      let posts: XPost[] = [];
      if (fixtureName) {
        if (!allowed.has(fixtureName)) {
          json(res, 400, { error: "unknown fixture" });
          return;
        }
        const raw = readFileSync(join(ROOT, "fixtures", `${fixtureName}.jsonl`), "utf8");
        posts = parseJsonl(raw);
      } else if (Array.isArray(body.posts)) {
        posts = body.posts as XPost[];
      }
      if (attachTape(session, body) === "open") {
        session = ledger.openSession(String(body.channel ?? session.channel ?? "x"));
      } else if (body.channel) {
        session = { ...session, channel: String(body.channel) };
      }
      if (body.facts || body.streamerUtterance || body.clock_ns) {
        session = {
          ...session,
          glass: body.glass === true ? true : session.glass,
          window: {
            ...session.window,
            facts: String(body.facts ?? session.window.facts),
            streamerUtterance: String(
              body.streamerUtterance ?? session.window.streamerUtterance,
            ),
            citation: parseCitation(body) ?? session.window.citation ?? null,
          },
        };
      }
      const lines = postsToLines(posts, session.id);
      session = await pulseLines(session, lines);
      ledger.save(session);
      json(res, 200, { ...publicView(session), ingested: lines.length });
      return;
    }
    const file = join(ROOT, "public", url.pathname);
    if (req.method === "GET" && existsSync(file) && file.startsWith(join(ROOT, "public"))) {
      res.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" });
      res.end(readFileSync(file));
      return;
    }
    json(res, 404, { error: "not found" });
  } catch (err) {
    json(res, 500, { error: err instanceof Error ? err.message : "fail" });
  }
});

server.listen(PORT, () => {
  const status = judgeStatus();
  console.log(`Gloss dock http://127.0.0.1:${PORT}/dock`);
  console.log(`judge=${status.mode} session=${session.id}`);
});
