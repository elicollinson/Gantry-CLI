import { stat } from "node:fs/promises";

/**
 * Computes the next run time for a StartInterval-based launchd job.
 *
 * StartInterval specifies a number of seconds between invocations.
 * If we can find the log file's mtime we use that as the "last ran" anchor;
 * otherwise we fall back to "now + interval" as an approximation.
 */
export async function nextRunFromStartInterval(
  intervalSeconds: number,
  logPath?: string,
): Promise<Date> {
  const now = new Date();
  const intervalMs = intervalSeconds * 1000;

  if (logPath) {
    try {
      const fileStat = await stat(logPath);
      const mtime = fileStat.mtime;

      if (mtime) {
        const lastRanMs =
          typeof mtime === "number" ? mtime : mtime.getTime();

        let nextRunMs = lastRanMs + intervalMs;

        // If the computed next run is already in the past, advance by
        // whole intervals until we land in the future.
        if (nextRunMs <= now.getTime()) {
          const elapsed = now.getTime() - lastRanMs;
          const fullIntervals = Math.ceil(elapsed / intervalMs);
          nextRunMs = lastRanMs + fullIntervals * intervalMs;
        }

        return new Date(nextRunMs);
      }
    } catch {
      // File doesn't exist or stat failed – fall through to the default.
    }
  }

  // No log path or stat failed: best guess is now + interval
  return new Date(now.getTime() + intervalMs);
}
