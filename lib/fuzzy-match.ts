export function normalizeTitle(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(\d{4}\)\s*$/, " ")
    .replace(/\s+-\s+\d{4}\s*$/, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

// Edit distance between two titles if they're a plausible same-show match,
// null otherwise — lets a caller with multiple candidates pick the closest
// one instead of just the first one that clears the bar. Exact match after
// normalization always counts (distance 0). Below 6 characters requires
// exact equality — no forced minimum edit tolerance for short names, since
// that let 4-letter titles a single edit apart (e.g. "Cars"/"Cats") match
// each other, which is too permissive for grouping otherwise-unrelated
// shows on a kids' kiosk.
export function titleMatchDistance(a: string, b: string): number | null {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return null;
  if (na === nb) return 0;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen < 6) return null;
  const distance = levenshtein(na, nb);
  return distance <= Math.floor(maxLen * 0.12) ? distance : null;
}

export function titlesLikelyMatch(a: string, b: string): boolean {
  return titleMatchDistance(a, b) !== null;
}
