import { describe, test, expect } from "bun:test";
import {
  nextRunFromCalendarInterval,
  nextRunFromCalendarIntervals,
} from "../../src/schedule/calendar-interval.ts";

describe("nextRunFromCalendarInterval", () => {
  test("Hour+Minute only: returns a date with the correct hour and minute", () => {
    const result = nextRunFromCalendarInterval({ Hour: 18, Minute: 16 });
    expect(result).not.toBeNull();
    expect(result!.getHours()).toBe(18);
    expect(result!.getMinutes()).toBe(16);
  });

  test("Hour+Minute only: result is in the future", () => {
    const result = nextRunFromCalendarInterval({ Hour: 18, Minute: 16 });
    expect(result).not.toBeNull();
    expect(result!.getTime()).toBeGreaterThan(Date.now());
  });

  test("Hour+Minute only: next run is today or tomorrow", () => {
    const result = nextRunFromCalendarInterval({ Hour: 18, Minute: 16 });
    expect(result).not.toBeNull();
    const now = new Date();
    const diffMs = result!.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    // Should be within 24 hours
    expect(diffHours).toBeLessThanOrEqual(24);
    expect(diffHours).toBeGreaterThan(0);
  });

  test("Weekday+Hour+Minute: next run is on the correct weekday", () => {
    // Monday at 9:00 AM
    const result = nextRunFromCalendarInterval({
      Weekday: 1,
      Hour: 9,
      Minute: 0,
    });
    expect(result).not.toBeNull();
    expect(result!.getDay()).toBe(1); // Monday
    expect(result!.getHours()).toBe(9);
    expect(result!.getMinutes()).toBe(0);
  });

  test("Day+Hour+Minute: next run is on the correct day of month", () => {
    const result = nextRunFromCalendarInterval({
      Day: 15,
      Hour: 12,
      Minute: 0,
    });
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(15);
    expect(result!.getHours()).toBe(12);
    expect(result!.getMinutes()).toBe(0);
  });

  test("Day+Weekday both specified: OR logic (runs when either matches)", () => {
    // Day 1 OR Wednesday at noon
    const result = nextRunFromCalendarInterval({
      Day: 1,
      Weekday: 3,
      Hour: 12,
      Minute: 0,
    });
    expect(result).not.toBeNull();
    // Should match either day 1 or Wednesday
    const matchesDay = result!.getDate() === 1;
    const matchesWeekday = result!.getDay() === 3;
    expect(matchesDay || matchesWeekday).toBe(true);
    expect(result!.getHours()).toBe(12);
    expect(result!.getMinutes()).toBe(0);
  });

  test("empty interval (all fields undefined): returns next minute", () => {
    const before = Date.now();
    const result = nextRunFromCalendarInterval({});
    expect(result).not.toBeNull();
    // An empty interval matches every minute, so next run should be ~1 minute away
    const diffMs = result!.getTime() - before;
    // Should be within about 2 minutes
    expect(diffMs).toBeLessThan(2 * 60 * 1000 + 1000);
    expect(diffMs).toBeGreaterThan(0);
  });

  test("Weekday 7 treated same as 0 (Sunday)", () => {
    const resultWeekday7 = nextRunFromCalendarInterval({
      Weekday: 7,
      Hour: 10,
      Minute: 0,
    });
    const resultWeekday0 = nextRunFromCalendarInterval({
      Weekday: 0,
      Hour: 10,
      Minute: 0,
    });
    expect(resultWeekday7).not.toBeNull();
    expect(resultWeekday0).not.toBeNull();
    // Both should land on Sunday
    expect(resultWeekday7!.getDay()).toBe(0);
    expect(resultWeekday0!.getDay()).toBe(0);
    // Both should have the same date
    expect(resultWeekday7!.getTime()).toBe(resultWeekday0!.getTime());
  });

  test("Month+Day: returns a date in the correct month and day", () => {
    const result = nextRunFromCalendarInterval({
      Month: 6,
      Day: 15,
      Hour: 12,
      Minute: 0,
    });
    expect(result).not.toBeNull();
    expect(result!.getMonth()).toBe(5); // JS months are 0-indexed
    expect(result!.getDate()).toBe(15);
    expect(result!.getHours()).toBe(12);
  });
});

describe("nextRunFromCalendarIntervals", () => {
  test("multiple intervals: returns earliest match", () => {
    // Two intervals: one matches every minute, one matches a specific time
    const earlyResult = nextRunFromCalendarIntervals([
      { Hour: 23, Minute: 59 }, // likely further away
      {},                        // matches every minute (earliest)
    ]);
    const lateOnlyResult = nextRunFromCalendarInterval({
      Hour: 23,
      Minute: 59,
    });

    expect(earlyResult).not.toBeNull();
    expect(lateOnlyResult).not.toBeNull();
    // The combined result should be at least as early as either individual result
    expect(earlyResult!.getTime()).toBeLessThanOrEqual(
      lateOnlyResult!.getTime()
    );
  });

  test("empty array: returns null", () => {
    const result = nextRunFromCalendarIntervals([]);
    expect(result).toBeNull();
  });
});
