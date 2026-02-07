import { describe, test, expect } from "bun:test";
import { parseCronSchedule } from "../../src/schedule/parse-cron.ts";

describe("parseCronSchedule", () => {
  describe("basic expressions", () => {
    test("30 6 * * * -> {Hour:6, Minute:30}", () => {
      const result = parseCronSchedule("30 6 * * *");
      expect(result.ok).toBe(true);
      expect(result.schedule?.type).toBe("calendar");
      expect(result.schedule?.calendarIntervals).toEqual([{ Hour: 6, Minute: 30 }]);
    });

    test("0 9 * * * -> {Hour:9, Minute:0}", () => {
      const result = parseCronSchedule("0 9 * * *");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([{ Hour: 9, Minute: 0 }]);
    });

    test("0 18 * * * -> {Hour:18, Minute:0}", () => {
      const result = parseCronSchedule("0 18 * * *");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([{ Hour: 18, Minute: 0 }]);
    });

    test("* * * * * -> empty CalendarInterval (every minute)", () => {
      const result = parseCronSchedule("* * * * *");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([{}]);
    });
  });

  describe("weekday ranges", () => {
    test("0 9 * * 1-5 -> 5 weekday intervals", () => {
      const result = parseCronSchedule("0 9 * * 1-5");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toHaveLength(5);
      const weekdays = result.schedule!.calendarIntervals!.map((i) => i.Weekday);
      expect(weekdays).toEqual([1, 2, 3, 4, 5]);
      for (const interval of result.schedule!.calendarIntervals!) {
        expect(interval.Hour).toBe(9);
        expect(interval.Minute).toBe(0);
      }
    });

    test("0 10 * * 0,6 -> 2 weekend intervals", () => {
      const result = parseCronSchedule("0 10 * * 0,6");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toHaveLength(2);
      const weekdays = result.schedule!.calendarIntervals!.map((i) => i.Weekday);
      expect(weekdays).toEqual([0, 6]);
    });
  });

  describe("step values", () => {
    test("*/15 * * * * -> StartInterval 900", () => {
      const result = parseCronSchedule("*/15 * * * *");
      expect(result.ok).toBe(true);
      expect(result.schedule?.type).toBe("interval");
      expect(result.schedule?.startInterval).toBe(900);
    });

    test("*/30 * * * * -> StartInterval 1800", () => {
      const result = parseCronSchedule("*/30 * * * *");
      expect(result.ok).toBe(true);
      expect(result.schedule?.startInterval).toBe(1800);
    });
  });

  describe("day of month", () => {
    test("0 0 1 * * -> monthly on day 1 at midnight", () => {
      const result = parseCronSchedule("0 0 1 * *");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([
        { Day: 1, Hour: 0, Minute: 0 },
      ]);
    });

    test("30 12 15 * * -> day 15 at 12:30", () => {
      const result = parseCronSchedule("30 12 15 * *");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([
        { Day: 15, Hour: 12, Minute: 30 },
      ]);
    });
  });

  describe("month field", () => {
    test("0 0 1 6 * -> June 1st at midnight", () => {
      const result = parseCronSchedule("0 0 1 6 *");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([
        { Month: 6, Day: 1, Hour: 0, Minute: 0 },
      ]);
    });
  });

  describe("weekday 7 normalization", () => {
    test("0 9 * * 7 -> Sunday (weekday 0)", () => {
      const result = parseCronSchedule("0 9 * * 7");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals?.[0]?.Weekday).toBe(0);
    });
  });

  describe("errors", () => {
    test("too few fields", () => {
      const result = parseCronSchedule("30 6 * *");
      expect(result.ok).toBe(false);
      expect(result.error).toContain("5 fields");
    });

    test("too many fields", () => {
      const result = parseCronSchedule("30 6 * * * *");
      expect(result.ok).toBe(false);
      expect(result.error).toContain("5 fields");
    });

    test("invalid minute (60)", () => {
      const result = parseCronSchedule("60 6 * * *");
      expect(result.ok).toBe(false);
      expect(result.error).toContain("minute");
    });

    test("invalid hour (25)", () => {
      const result = parseCronSchedule("0 25 * * *");
      expect(result.ok).toBe(false);
      expect(result.error).toContain("hour");
    });

    test("invalid day range (0-32)", () => {
      const result = parseCronSchedule("0 0 32 * *");
      expect(result.ok).toBe(false);
    });

    test("invalid weekday (8)", () => {
      const result = parseCronSchedule("0 0 * * 8");
      expect(result.ok).toBe(false);
    });

    test("empty string", () => {
      const result = parseCronSchedule("");
      expect(result.ok).toBe(false);
    });

    test("non-numeric field", () => {
      const result = parseCronSchedule("abc 0 * * *");
      expect(result.ok).toBe(false);
    });
  });

  describe("preview fields", () => {
    test("includes humanReadable", () => {
      const result = parseCronSchedule("0 9 * * *");
      expect(result.ok).toBe(true);
      expect(result.humanReadable).toBe("Daily at 9:00 AM");
    });

    test("includes nextRun", () => {
      const result = parseCronSchedule("0 9 * * *");
      expect(result.ok).toBe(true);
      expect(result.nextRun).toBeInstanceOf(Date);
    });
  });
});
