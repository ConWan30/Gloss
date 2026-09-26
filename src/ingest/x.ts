import type { Line } from "../types.ts";

export type XPost = {
  id: string;
  user: string;
  text: string;
  createdMs: number;
  conversationId?: string;
};

export function normalizeText(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/@\w+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

export function postsToLines(posts: XPost[], sessionId: string): Line[] {
  return [...posts]
    .sort((a, b) => a.createdMs - b.createdMs)
    .map((post) => ({
      id: post.id || crypto.randomUUID(),
      sessionId,
      clockMs: post.createdMs,
      user: post.user.replace(/^@/, "") || "anon",
      text: normalizeText(post.text),
    }))
    .filter((line) => line.text.length > 0);
}

export function parseJsonl(raw: string): XPost[] {
  const posts: XPost[] = [];
  for (const row of raw.split("\n")) {
    const trimmed = row.trim();
    if (!trimmed) continue;
    const obj = JSON.parse(trimmed) as Record<string, unknown>;
    posts.push({
      id: String(obj.id ?? obj.post_id ?? crypto.randomUUID()),
      user: String(obj.user ?? obj.username ?? "anon"),
      text: String(obj.text ?? obj.content ?? ""),
      createdMs: Number(obj.createdMs ?? obj.clockMs ?? Date.now()),
      conversationId: obj.conversationId ? String(obj.conversationId) : undefined,
    });
  }
  return posts;
}
