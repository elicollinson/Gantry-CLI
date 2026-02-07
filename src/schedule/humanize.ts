import type { CalendarInterval, PlistConfig } from "../types.ts";

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Formats an hour (0-23) and minute (0-59) into 12-hour time like "6:16 PM".
 */
export function formatTime12h(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  let displayHour = hour % 12;
  if (displayHour === 0) displayHour = 12;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Returns the short weekday name for a launchd weekday value (0-7, where
 * both 0 and 7 mean Sunday).
 */
function weekdayName(weekday: number): string {
  const normalized = weekday === 7 ? 0 : weekday;
  return WEEKDAY_NAMES[normalized] ?? `Day${weekday}`;
}

/**
 * Produces a human-readable description of a single CalendarInterval.
 *
 * Examples:
 *  - { Hour: 14, Minute: 30 }              -> "Daily at 2:30 PM"
 *  - { Minute: 15 }                        -> "Hourly at :15"
 *  - { Weekday: 1, Hour: 9, Minute: 0 }    -> "Mon at 9:00 AM"
 *  - { Day: 1, Hour: 0, Minute: 0 }        -> "Monthly on day 1 at 12:00 AM"
 *  - { Month: 6, Day: 15, Hour: 12, Minute: 0 } -> "Jun 15 at 12:00 PM"
 *  - { Weekday: 3 }                        -> "Every Wed"
 *  - {}                                     -> "Every minute"
 */
function humanizeInterval(interval: CalendarInterval): string {
  const hasMonth = interval.Month !== undefined;
  const hasDay = interval.Day !== undefined;
  const hasWeekday = interval.Weekday !== undefined;
  const hasHour = interval.Hour !== undefined;
  const hasMinute = interval.Minute !== undefined;

  const timeStr =
    hasHour && hasMinute
      ? formatTime12h(interval.Hour!, interval.Minute!)
      : hasHour
        ? formatTime12h(interval.Hour!, 0)
        : null;

  // Month + Day (+ optional time)
  if (hasMonth && hasDay) {
    const monthName = MONTH_NAMES[(interval.Month! - 1)] ?? `Month${interval.Month}`;
    const base = `${monthName} ${interval.Day}`;
    return timeStr ? `${base} at ${timeStr}` : base;
  }

  // Day of month + time
  if (hasDay && !hasWeekday) {
    const base = `Monthly on day ${interval.Day}`;
    return timeStr ? `${base} at ${timeStr}` : base;
  }

  // Weekday + time
  if (hasWeekday && !hasDay) {
    const name = weekdayName(interval.Weekday!);
    if (timeStr) {
      return `${name} at ${timeStr}`;
    }
    return `Every ${name}`;
  }

  // Both Day and Weekday specified (OR semantics, but we still describe both)
  if (hasDay && hasWeekday) {
    const name = weekdayName(interval.Weekday!);
    const base = `Day ${interval.Day} or ${name}`;
    return timeStr ? `${base} at ${timeStr}` : base;
  }

  // Hour + Minute only (daily)
  if (hasHour && hasMinute) {
    return `Daily at ${timeStr}`;
  }

  // Hour only (daily, minute defaults to 0)
  if (hasHour) {
    return `Daily at ${timeStr}`;
  }

  // Minute only (hourly)
  if (hasMinute) {
    return `Hourly at :${interval.Minute!.toString().padStart(2, "0")}`;
  }

  // Nothing specified at all
  return "Every minute";
}

/**
 * Converts a duration in seconds to a compact human-readable string.
 * E.g. 3600 -> "1h", 86400 -> "1 day", 300 -> "5m", 45 -> "45s"
 */
function humanizeDuration(seconds: number): string {
  if (seconds <= 0) return `${seconds}s`;

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // Exact days
  if (seconds % 86400 === 0) {
    return days === 1 ? "1 day" : `${days} days`;
  }

  // Exact hours
  if (seconds % 3600 === 0) {
    return `${hours + days * 24}h`;
  }

  // Exact minutes
  if (seconds % 60 === 0) {
    return `${minutes + hours * 60 + days * 1440}m`;
  }

  // Mixed – show the two most significant non-zero components
  if (days > 0) {
    return hours > 0 ? `${days} days ${hours}h` : `${days} days ${minutes}m`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
  }

  return `${secs}s`;
}

/**
 * Produces a human-readable schedule string for a PlistConfig.
 */
export function humanizeSchedule(config: PlistConfig): string {
  // StartInterval
  if (config.StartInterval !== undefined) {
    return `Every ${humanizeDuration(config.StartInterval)}`;
  }

  // StartCalendarInterval (single object or array)
  if (config.StartCalendarInterval !== undefined) {
    const intervals = Array.isArray(config.StartCalendarInterval)
      ? config.StartCalendarInterval
      : [config.StartCalendarInterval];

    return intervals.map(humanizeInterval).join(" or ");
  }

  // RunAtLoad with no schedule
  if (config.RunAtLoad) {
    return "On load only";
  }

  return "On demand";
}
