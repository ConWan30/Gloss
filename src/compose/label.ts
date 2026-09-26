const CUT = 48;

export function spanLabel(text: string): string {
  const cleaned = text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "unlabeled claim";
  if (cleaned.length <= CUT) return cleaned;
  const slice = cleaned.slice(0, CUT);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > 16 ? slice.slice(0, lastSpace) : slice).trim()}…`;
}
