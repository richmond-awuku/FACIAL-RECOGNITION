export function formatMatchSimilarity(
  value: number | string | null | undefined,
  decimals = 2,
): string {
  if (value === null || value === undefined || value === "") return "—";
  const score = Number(value);
  return Number.isFinite(score) ? `${(score * 100).toFixed(decimals)}%` : "—";
}
