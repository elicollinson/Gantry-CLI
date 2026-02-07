import type { PlistConfig, Schedule } from "../types.ts";
import { nextRunFromCalendarIntervals } from "./calendar-interval.ts";
import { nextRunFromStartInterval } from "./start-interval.ts";
import { humanizeSchedule } from "./humanize.ts";

export { nextRunFromCalendarIntervals, nextRunFromCalendarInterval } from "./calendar-interval.ts";
export { nextRunFromStartInterval } from "./start-interval.ts";
export { humanizeSchedule, formatTime12h } from "./humanize.ts";
export { computePreview } from "./preview.ts";

/**
 * Computes a unified Schedule object for a given plist configuration.
 *
 * Inspects StartCalendarInterval, StartInterval, and RunAtLoad to determine
 * the schedule type, a human-readable description, and the next run time.
 */
export async function computeSchedule(config: PlistConfig): Promise<Schedule> {
  // Calendar-based schedule
  if (config.StartCalendarInterval !== undefined) {
    const intervals = Array.isArray(config.StartCalendarInterval)
      ? config.StartCalendarInterval
      : [config.StartCalendarInterval];

    return {
      type: "calendar",
      humanReadable: humanizeSchedule(config),
      nextRun: nextRunFromCalendarIntervals(intervals),
    };
  }

  // Interval-based schedule
  if (config.StartInterval !== undefined) {
    // Determine the best log path to use as an anchor for "last ran" time
    const logPath = config.StandardOutPath ?? config.StandardErrorPath;

    return {
      type: "interval",
      humanReadable: humanizeSchedule(config),
      nextRun: await nextRunFromStartInterval(config.StartInterval, logPath),
    };
  }

  // RunAtLoad with no recurring schedule
  if (config.RunAtLoad) {
    return {
      type: "run-at-load",
      humanReadable: humanizeSchedule(config),
      nextRun: null,
    };
  }

  // No schedule at all
  return {
    type: "on-demand",
    humanReadable: humanizeSchedule(config),
    nextRun: null,
  };
}
