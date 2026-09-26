import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "../..");

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

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODEL = process.env.GLOSS_MODEL ?? "jev-latest";

export async function probeJev(key = process.env.TYPESAFE_API_KEY) {
  if (!key) {
    return { ok: false, mode: "fixture" as const, error: "no TYPESAFE_API_KEY" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        state: { ping: "gloss" },
        questions: {
          alive: {
            type: "noul",
            instructions: "Is this a live ping from the Gloss dock?",
            criteria: {
              true: "The state ping is gloss.",
              false: "The state ping is missing or other.",
            },
          },
        },
      }),
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        mode: "live-down" as const,
        error: `TypeSafe ${response.status}: ${text.slice(0, 180)}`,
      };
    }
    const payload = JSON.parse(text) as {
      model?: string;
      answers?: { alive?: { noul?: number } };
    };
    return {
      ok: true,
      mode: "live" as const,
      model: payload.model ?? MODEL,
      noul: payload.answers?.alive?.noul ?? null,
    };
  } catch (err) {
    return {
      ok: false,
      mode: "live-down" as const,
      error: err instanceof Error ? err.message : "network",
    };
  } finally {
    clearTimeout(timer);
  }
}

const invoked = process.argv[1]?.replaceAll("\\", "/").endsWith("/src/jev/probe.ts");
if (invoked) {
  const result = await probeJev();
  console.log(JSON.stringify(result));
  process.exit(result.ok ? 0 : 1);
}
