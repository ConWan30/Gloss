export type JudgeMode = "fixture" | "live" | "live-down";

let lastError: string | null = null;
let lastOk = false;

export function noteLiveOk() {
  lastError = null;
  lastOk = true;
}

export function noteLiveFail(message: string) {
  lastError = message.slice(0, 240);
  lastOk = false;
}

export function judgeStatus(): { mode: JudgeMode; error: string | null } {
  if (!process.env.TYPESAFE_API_KEY) {
    return { mode: "fixture", error: null };
  }
  if (lastError) return { mode: "live-down", error: lastError };
  return { mode: lastOk ? "live" : "live", error: null };
}
