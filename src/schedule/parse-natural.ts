import type { CalendarInterval, ScheduleParseResult, ParsedSchedule } from "../types.ts";
import { humanizeSchedule } from "./humanize.ts";
import { nextRunFromCalendarIntervals } from "./calendar-interval.ts";

interface TimeResult {
  hour: number;
  minute: number;
}

const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

/**
 * Parses time strings like "6:00 PM", "6PM", "18:00", "noon", "midnight".
 */
function parseTime(str: string): TimeResult | null {
  const s = str.trim().toLowerCase();

  if (s === "noon") return { hour: 12, minute: 0 };
  if (s === "midnight") return { hour: 0, minute: 0 };

  // "6:30 PM", "6:30PM", "6:30 pm"
  const match12 = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (match12) {
    let hour = parseInt(match12[1]!, 10);
    const minute = parseInt(match12[2]!, 10);
    const period = match12[3]!;
    if (hour < 1 || hour > 12 || minute > 59) return null;
    if (period === "am" && hour === 12) hour = 0;
    else if (period === "pm" && hour !== 12) hour += 12;
    return { hour, minute };
  }

  // "6PM", "6 PM", "6 am"
  const matchHourOnly = s.match(/^(\d{1,2})\s*(am|pm)$/);
  if (matchHourOnly) {
    let hour = parseInt(matchHourOnly[1]!, 10);
    const period = matchHourOnly[2]!;
    if (hour < 1 || hour > 12) return null;
    if (period === "am" && hour === 12) hour = 0;
    else if (period === "pm" && hour !== 12) hour += 12;
    return { hour, minute: 0 };
  }

  // "18:00" (24-hour)
  const match24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hour = parseInt(match24[1]!, 10);
    const minute = parseInt(match24[2]!, 10);
    if (hour > 23 || minute > 59) return null;
    return { hour, minute };
  }

  return null;
}

type PatternHandler = (match: RegExpMatchArray) => ParsedSchedule | null;

interface Pattern {
  regex: RegExp;
  handler: PatternHandler;
}

const patterns: Pattern[] = [
  // "every minute"
  {
    regex: /^every\s+minute$/i,
    handler: () => ({
      type: "calendar",
      calendarIntervals: [{}],
    }),
  },

  // "every N hours/minutes/seconds/days"
  {
    regex: /^every\s+(\d+)\s+(hour|minute|second|day)s?$/i,
    handler: (m) => {
      const n = parseInt(m[1]!, 10);
      const unit = m[2]!.toLowerCase();
      const multipliers: Record<string, number> = {
        second: 1,
        minute: 60,
        hour: 3600,
        day: 86400,
      };
      const seconds = n * multipliers[unit]!;
      if (seconds <= 0) return null;
      return { type: "interval", startInterval: seconds };
    },
  },

  // "hourly"
  {
    regex: /^hourly$/i,
    handler: () => ({ type: "interval", startInterval: 3600 }),
  },

  // "daily" (no time specified)
  {
    regex: /^daily$/i,
    handler: () => ({ type: "interval", startInterval: 86400 }),
  },

  // "daily at TIME"
  {
    regex: /^daily\s+at\s+(.+)$/i,
    handler: (m) => {
      const time = parseTime(m[1]!);
      if (!time) return null;
      return {
        type: "calendar",
        calendarIntervals: [{ Hour: time.hour, Minute: time.minute }],
      };
    },
  },

  // "hourly at :MM"
  {
    regex: /^hourly\s+at\s+:(\d{1,2})$/i,
    handler: (m) => {
      const minute = parseInt(m[1]!, 10);
      if (minute > 59) return null;
      return {
        type: "calendar",
        calendarIntervals: [{ Minute: minute }],
      };
    },
  },

  // "every monday at TIME"
  {
    regex: /^every\s+(\w+)\s+at\s+(.+)$/i,
    handler: (m) => {
      const dayName = m[1]!.toLowerCase();
      const weekday = WEEKDAY_MAP[dayName];
      if (weekday === undefined) return null;
      const time = parseTime(m[2]!);
      if (!time) return null;
      return {
        type: "calendar",
        calendarIntervals: [{ Weekday: weekday, Hour: time.hour, Minute: time.minute }],
      };
    },
  },

  // "weekdays at TIME"
  {
    regex: /^weekdays\s+at\s+(.+)$/i,
    handler: (m) => {
      const time = parseTime(m[1]!);
      if (!time) return null;
      const intervals: CalendarInterval[] = [1, 2, 3, 4, 5].map((wd) => ({
        Weekday: wd,
        Hour: time.hour,
        Minute: time.minute,
      }));
      return { type: "calendar", calendarIntervals: intervals };
    },
  },

  // "weekends at TIME"
  {
    regex: /^weekends\s+at\s+(.+)$/i,
    handler: (m) => {
      const time = parseTime(m[1]!);
      if (!time) return null;
      const intervals: CalendarInterval[] = [0, 6].map((wd) => ({
        Weekday: wd,
        Hour: time.hour,
        Minute: time.minute,
      }));
      return { type: "calendar", calendarIntervals: intervals };
    },
  },

  // "monthly on day DD at TIME"
  {
    regex: /^monthly\s+on\s+day\s+(\d{1,2})\s+at\s+(.+)$/i,
    handler: (m) => {
      const day = parseInt(m[1]!, 10);
      if (day < 1 || day > 31) return null;
      const time = parseTime(m[2]!);
      if (!time) return null;
      return {
        type: "calendar",
        calendarIntervals: [{ Day: day, Hour: time.hour, Minute: time.minute }],
      };
    },
  },
];

function computePreview(schedule: ParsedSchedule): { humanReadable: string; nextRun: Date | null } {
  if (schedule.type === "interval" && schedule.startInterval) {
    const config = { Label: "preview", StartInterval: schedule.startInterval };
    return {
      humanReadable: humanizeSchedule(config),
      nextRun: new Date(Date.now() + schedule.startInterval * 1000),
    };
  }

  if (schedule.type === "calendar" && schedule.calendarIntervals) {
    const config = {
      Label: "preview",
      StartCalendarInterval: schedule.calendarIntervals.length === 1
        ? schedule.calendarIntervals[0]!
        : schedule.calendarIntervals,
    };
    return {
      humanReadable: humanizeSchedule(config),
      nextRun: nextRunFromCalendarIntervals(schedule.calendarIntervals),
    };
  }

  return { humanReadable: "Unknown", nextRun: null };
}

/**
 * Parses a natural language schedule string into a ParsedSchedule.
 */
export function parseNaturalSchedule(input: string): ScheduleParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter a schedule" };
  }

  for (const { regex, handler } of patterns) {
    const match = trimmed.match(regex);
    if (match) {
      const schedule = handler(match);
      if (schedule) {
        const preview = computePreview(schedule);
        return {
          ok: true,
          schedule,
          humanReadable: preview.humanReadable,
          nextRun: preview.nextRun,
        };
      }
    }
  }

  return { ok: false, error: "Unrecognized schedule format" };
}
