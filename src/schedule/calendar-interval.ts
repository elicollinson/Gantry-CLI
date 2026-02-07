import type { CalendarInterval } from "../types.ts";

/**
 * Maximum number of minutes to search forward (1 year).
 */
const MAX_SEARCH_MINUTES = 365 * 24 * 60;

/**
 * Checks whether a single CalendarInterval matches a given Date.
 *
 * Rules:
 *  - Undefined/missing fields are wildcards (match anything).
 *  - All specified fields must match (AND logic)...
 *  - ...EXCEPT when both Day and Weekday are specified, in which case
 *    the job fires when EITHER matches (OR between Day and Weekday).
 *  - Weekday 7 is treated the same as 0 (both mean Sunday).
 */
function intervalMatchesDate(interval: CalendarInterval, d: Date): boolean {
  // Month: CalendarInterval uses 1-12, JS Date.getMonth() returns 0-11
  if (interval.Month !== undefined && interval.Month !== d.getMonth() + 1) {
    return false;
  }

  // Hour
  if (interval.Hour !== undefined && interval.Hour !== d.getHours()) {
    return false;
  }

  // Minute
  if (interval.Minute !== undefined && interval.Minute !== d.getMinutes()) {
    return false;
  }

  // Day and Weekday with special OR logic when both are present
  const daySpecified = interval.Day !== undefined;
  const weekdaySpecified = interval.Weekday !== undefined;

  if (daySpecified && weekdaySpecified) {
    // When both are specified, EITHER must match (OR logic)
    const dayMatches = interval.Day === d.getDate();
    const normalizedWeekday =
      interval.Weekday === 7 ? 0 : interval.Weekday!;
    const weekdayMatches = normalizedWeekday === d.getDay();
    if (!dayMatches && !weekdayMatches) {
      return false;
    }
  } else {
    // Normal AND logic for whichever is specified
    if (daySpecified && interval.Day !== d.getDate()) {
      return false;
    }
    if (weekdaySpecified) {
      const normalizedWeekday =
        interval.Weekday === 7 ? 0 : interval.Weekday!;
      if (normalizedWeekday !== d.getDay()) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Determine how many minutes we can safely skip forward when a candidate
 * date fails to match an interval.  This avoids the naive approach of
 * checking every single minute up to a year out.
 *
 * The strategy is conservative: we only skip when we can prove that no
 * earlier minute could possibly match.
 */
function skipMinutes(interval: CalendarInterval, d: Date): number {
  // If the month is specified and doesn't match, skip to the 1st of
  // that month (in the same year, or next year if the month already passed).
  if (interval.Month !== undefined && interval.Month !== d.getMonth() + 1) {
    const targetMonth = interval.Month - 1; // JS 0-indexed
    let targetYear = d.getFullYear();
    if (targetMonth <= d.getMonth()) {
      targetYear++;
    }
    const target = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const diff = Math.floor(
      (target.getTime() - d.getTime()) / (60 * 1000),
    );
    return Math.max(diff, 1);
  }

  // If hour is specified and doesn't match, skip to that hour.
  if (interval.Hour !== undefined && interval.Hour !== d.getHours()) {
    let target: Date;
    if (interval.Hour > d.getHours()) {
      // Later today
      target = new Date(d);
      target.setHours(interval.Hour, 0, 0, 0);
    } else {
      // Next day at that hour
      target = new Date(d);
      target.setDate(target.getDate() + 1);
      target.setHours(interval.Hour, 0, 0, 0);
    }
    const diff = Math.floor(
      (target.getTime() - d.getTime()) / (60 * 1000),
    );
    return Math.max(diff, 1);
  }

  // If minute is specified and doesn't match, skip to that minute.
  if (interval.Minute !== undefined && interval.Minute !== d.getMinutes()) {
    let diff: number;
    if (interval.Minute > d.getMinutes()) {
      diff = interval.Minute - d.getMinutes();
    } else {
      diff = 60 - d.getMinutes() + interval.Minute;
    }
    return Math.max(diff, 1);
  }

  // Day / Weekday mismatch – when only Day is specified
  const daySpecified = interval.Day !== undefined;
  const weekdaySpecified = interval.Weekday !== undefined;

  if (daySpecified && !weekdaySpecified && interval.Day !== d.getDate()) {
    // Skip to the start of the target day
    if (interval.Day! > d.getDate()) {
      const target = new Date(d);
      target.setDate(interval.Day!);
      target.setHours(0, 0, 0, 0);
      const diff = Math.floor(
        (target.getTime() - d.getTime()) / (60 * 1000),
      );
      return Math.max(diff, 1);
    } else {
      // Next month
      const target = new Date(d);
      target.setMonth(target.getMonth() + 1, interval.Day!);
      target.setHours(0, 0, 0, 0);
      const diff = Math.floor(
        (target.getTime() - d.getTime()) / (60 * 1000),
      );
      return Math.max(diff, 1);
    }
  }

  // Weekday only – skip to the next matching weekday
  if (weekdaySpecified && !daySpecified) {
    const normalizedWeekday =
      interval.Weekday === 7 ? 0 : interval.Weekday!;
    if (normalizedWeekday !== d.getDay()) {
      let daysUntil = normalizedWeekday - d.getDay();
      if (daysUntil <= 0) daysUntil += 7;
      const target = new Date(d);
      target.setDate(target.getDate() + daysUntil);
      target.setHours(0, 0, 0, 0);
      const diff = Math.floor(
        (target.getTime() - d.getTime()) / (60 * 1000),
      );
      return Math.max(diff, 1);
    }
  }

  return 1;
}

/**
 * Finds the next run time from an array of CalendarIntervals.
 *
 * The intervals are OR'd together – the earliest match from any of them wins.
 * Within a single CalendarInterval all specified fields must match (AND),
 * with the exception that Day + Weekday together use OR semantics.
 */
export function nextRunFromCalendarIntervals(
  intervals: CalendarInterval[],
): Date | null {
  if (intervals.length === 0) return null;

  const now = new Date();
  // Start from the next whole minute after now
  const candidate = new Date(now);
  candidate.setSeconds(0, 0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  let minutesSearched = 0;

  while (minutesSearched < MAX_SEARCH_MINUTES) {
    // Check if ANY interval matches the candidate
    for (const interval of intervals) {
      if (intervalMatchesDate(interval, candidate)) {
        return new Date(candidate);
      }
    }

    // Determine the minimum skip across all intervals (since they are OR'd,
    // the smallest skip is the safest – we might match a different interval
    // sooner).
    let minSkip = MAX_SEARCH_MINUTES;
    for (const interval of intervals) {
      const skip = skipMinutes(interval, candidate);
      if (skip < minSkip) minSkip = skip;
    }

    candidate.setMinutes(candidate.getMinutes() + minSkip);
    minutesSearched += minSkip;
  }

  return null;
}

/**
 * Convenience wrapper for a single CalendarInterval.
 */
export function nextRunFromCalendarInterval(
  interval: CalendarInterval,
): Date | null {
  return nextRunFromCalendarIntervals([interval]);
}
