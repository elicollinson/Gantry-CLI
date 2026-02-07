import { describe, test, expect } from "bun:test";
import { parseNaturalSchedule } from "../../src/schedule/parse-natural.ts";

describe("parseNaturalSchedule", () => {
  describe("intervals", () => {
    test("every 4 hours -> StartInterval 14400", () => {
      const result = parseNaturalSchedule("every 4 hours");
      expect(result.ok).toBe(true);
      expect(result.schedule?.type).toBe("interval");
      expect(result.schedule?.startInterval).toBe(14400);
    });

    test("every 30 minutes -> StartInterval 1800", () => {
      const result = parseNaturalSchedule("every 30 minutes");
      expect(result.ok).toBe(true);
      expect(result.schedule?.startInterval).toBe(1800);
    });

    test("every 1 hour -> StartInterval 3600", () => {
      const result = parseNaturalSchedule("every 1 hour");
      expect(result.ok).toBe(true);
      expect(result.schedule?.startInterval).toBe(3600);
    });

    test("every 90 seconds -> StartInterval 90", () => {
      const result = parseNaturalSchedule("every 90 seconds");
      expect(result.ok).toBe(true);
      expect(result.schedule?.startInterval).toBe(90);
    });

    test("every 2 days -> StartInterval 172800", () => {
      const result = parseNaturalSchedule("every 2 days");
      expect(result.ok).toBe(true);
      expect(result.schedule?.startInterval).toBe(172800);
    });

    test("hourly -> StartInterval 3600", () => {
      const result = parseNaturalSchedule("hourly");
      expect(result.ok).toBe(true);
      expect(result.schedule?.startInterval).toBe(3600);
    });

    test("daily (no time) -> StartInterval 86400", () => {
      const result = parseNaturalSchedule("daily");
      expect(result.ok).toBe(true);
      expect(result.schedule?.startInterval).toBe(86400);
    });
  });

  describe("calendar intervals", () => {
    test("daily at 6:00 PM -> {Hour:18, Minute:0}", () => {
      const result = parseNaturalSchedule("daily at 6:00 PM");
      expect(result.ok).toBe(true);
      expect(result.schedule?.type).toBe("calendar");
      expect(result.schedule?.calendarIntervals).toEqual([{ Hour: 18, Minute: 0 }]);
    });

    test("daily at 9:00 AM -> {Hour:9, Minute:0}", () => {
      const result = parseNaturalSchedule("daily at 9:00 AM");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([{ Hour: 9, Minute: 0 }]);
    });

    test("hourly at :15 -> {Minute:15}", () => {
      const result = parseNaturalSchedule("hourly at :15");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([{ Minute: 15 }]);
    });

    test("every monday at 9:00 AM -> {Weekday:1, Hour:9, Minute:0}", () => {
      const result = parseNaturalSchedule("every monday at 9:00 AM");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([
        { Weekday: 1, Hour: 9, Minute: 0 },
      ]);
    });

    test("every friday at 5:00 PM -> {Weekday:5, Hour:17, Minute:0}", () => {
      const result = parseNaturalSchedule("every friday at 5:00 PM");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([
        { Weekday: 5, Hour: 17, Minute: 0 },
      ]);
    });

    test("weekdays at 9:00 AM -> 5 intervals (Mon-Fri)", () => {
      const result = parseNaturalSchedule("weekdays at 9:00 AM");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toHaveLength(5);
      const weekdays = result.schedule!.calendarIntervals!.map((i) => i.Weekday);
      expect(weekdays).toEqual([1, 2, 3, 4, 5]);
      for (const interval of result.schedule!.calendarIntervals!) {
        expect(interval.Hour).toBe(9);
        expect(interval.Minute).toBe(0);
      }
    });

    test("weekends at 10:00 AM -> 2 intervals (Sun, Sat)", () => {
      const result = parseNaturalSchedule("weekends at 10:00 AM");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toHaveLength(2);
      const weekdays = result.schedule!.calendarIntervals!.map((i) => i.Weekday);
      expect(weekdays).toEqual([0, 6]);
    });

    test("monthly on day 1 at 12:00 AM -> {Day:1, Hour:0, Minute:0}", () => {
      const result = parseNaturalSchedule("monthly on day 1 at 12:00 AM");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([
        { Day: 1, Hour: 0, Minute: 0 },
      ]);
    });

    test("monthly on day 15 at 6:00 PM -> {Day:15, Hour:18, Minute:0}", () => {
      const result = parseNaturalSchedule("monthly on day 15 at 6:00 PM");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([
        { Day: 15, Hour: 18, Minute: 0 },
      ]);
    });

    test("every minute -> empty CalendarInterval", () => {
      const result = parseNaturalSchedule("every minute");
      expect(result.ok).toBe(true);
      expect(result.schedule?.type).toBe("calendar");
      expect(result.schedule?.calendarIntervals).toEqual([{}]);
    });
  });

  describe("time formats", () => {
    test("noon -> Hour:12, Minute:0", () => {
      const result = parseNaturalSchedule("daily at noon");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([{ Hour: 12, Minute: 0 }]);
    });

    test("midnight -> Hour:0, Minute:0", () => {
      const result = parseNaturalSchedule("daily at midnight");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([{ Hour: 0, Minute: 0 }]);
    });

    test("6PM -> Hour:18, Minute:0", () => {
      const result = parseNaturalSchedule("daily at 6PM");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([{ Hour: 18, Minute: 0 }]);
    });

    test("18:00 -> Hour:18, Minute:0", () => {
      const result = parseNaturalSchedule("daily at 18:00");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([{ Hour: 18, Minute: 0 }]);
    });

    test("12:00 AM -> Hour:0, Minute:0", () => {
      const result = parseNaturalSchedule("daily at 12:00 AM");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([{ Hour: 0, Minute: 0 }]);
    });

    test("12:00 PM -> Hour:12, Minute:0", () => {
      const result = parseNaturalSchedule("daily at 12:00 PM");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals).toEqual([{ Hour: 12, Minute: 0 }]);
    });
  });

  describe("errors", () => {
    test("gibberish returns error", () => {
      const result = parseNaturalSchedule("gibberish");
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("empty string returns error", () => {
      const result = parseNaturalSchedule("");
      expect(result.ok).toBe(false);
    });

    test("daily at 25:00 returns error", () => {
      const result = parseNaturalSchedule("daily at 25:00");
      expect(result.ok).toBe(false);
    });

    test("monthly on day 32 at 9:00 AM returns error", () => {
      const result = parseNaturalSchedule("monthly on day 32 at 9:00 AM");
      expect(result.ok).toBe(false);
    });

    test("hourly at :60 returns error", () => {
      const result = parseNaturalSchedule("hourly at :60");
      expect(result.ok).toBe(false);
    });
  });

  describe("case insensitivity", () => {
    test("DAILY AT 9:00 AM works", () => {
      const result = parseNaturalSchedule("DAILY AT 9:00 AM");
      expect(result.ok).toBe(true);
    });

    test("Every Monday at 6:00 PM works", () => {
      const result = parseNaturalSchedule("Every Monday at 6:00 PM");
      expect(result.ok).toBe(true);
      expect(result.schedule?.calendarIntervals?.[0]?.Weekday).toBe(1);
    });
  });

  describe("preview fields", () => {
    test("successful parse includes humanReadable", () => {
      const result = parseNaturalSchedule("daily at 6:00 PM");
      expect(result.ok).toBe(true);
      expect(result.humanReadable).toBe("Daily at 6:00 PM");
    });

    test("successful parse includes nextRun", () => {
      const result = parseNaturalSchedule("daily at 6:00 PM");
      expect(result.ok).toBe(true);
      expect(result.nextRun).toBeInstanceOf(Date);
    });

    test("interval parse includes humanReadable", () => {
      const result = parseNaturalSchedule("every 4 hours");
      expect(result.ok).toBe(true);
      expect(result.humanReadable).toContain("4h");
    });
  });
});
