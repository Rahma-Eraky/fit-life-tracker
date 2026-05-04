/**
 * Parse a duration in seconds out of a free-text workout step.
 *
 * Steps come from the seed as plain strings like:
 *   - "Warm up for 5 minutes"
 *   - "Plank: hold for 30 seconds"
 *   - "Squats: 4 sets of 10 reps"
 *   - "Push-ups, 3 sets x 12 reps"
 *
 * Rather than introduce a structured schema (which would mean a migration
 * + a re-seed + content-translations rewrite), we infer a sensible
 * countdown for each step from the text. This keeps the timer feature
 * fully additive — nothing else in the app changes.
 *
 * Recognized patterns (in order):
 *   1. "X minutes" / "X mins" / "X min"     → X * 60
 *   2. "X seconds" / "X secs" / "X sec"     → X
 *   3. "N sets of M reps" or "N x M reps"   → N * (M*3 + 30)
 *      (rough budget: 3s per rep + 30s rest per set)
 *
 * Fallback: a small randomized window of 30–45s. Per the product
 * decision, we don't want a fixed default so steps without explicit
 * cues still feel paced rather than identical.
 *
 * The function is intentionally pure (apart from the random fallback);
 * callers should compute the durations once on mount so the random
 * fallback stays stable across renders.
 */
export function parseStepDuration(step: string): number {
  if (!step) return randInt(30, 45);
  const text = step.toLowerCase();

  // 1. Minutes — e.g. "5 minutes", "10 mins", "1 min", "1.5 minutes"
  const minMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?\b)/);
  if (minMatch) {
    return Math.max(1, Math.round(parseFloat(minMatch[1]) * 60));
  }

  // 2. Seconds — e.g. "30 seconds", "45 sec", "20 secs"
  const secMatch = text.match(/(\d+)\s*(?:seconds?|secs?\b)/);
  if (secMatch) {
    return Math.max(1, parseInt(secMatch[1], 10));
  }

  // 3. Sets × reps — e.g. "3 sets of 12 reps", "4 sets x 10 reps",
  //    "3x12 reps", "4 × 8 reps"
  const setsMatch = text.match(
    /(\d+)\s*(?:sets?\s+of|x|×)\s*(\d+)\s*(?:reps?|repetitions?)/,
  );
  if (setsMatch) {
    const sets = parseInt(setsMatch[1], 10);
    const reps = parseInt(setsMatch[2], 10);
    if (sets > 0 && reps > 0) {
      // 3s per rep + 30s rest per set is a reasonable budget for most
      // bodyweight or beginner-strength movements.
      return sets * (reps * 3 + 30);
    }
  }

  // Fallback — randomized 30–45s so consecutive un-timed steps feel
  // paced rather than mechanical.
  return randInt(30, 45);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
