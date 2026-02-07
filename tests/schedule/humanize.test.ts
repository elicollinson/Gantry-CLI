import { describe, test, expect } from "bun:test";
import {
  formatTime12h,
  humanizeSchedule,
} from "../../src/schedule/humanize.ts";
import type { PlistConfig } from "../../src/types.ts";

describe("formatTime12h", () => {
  test("18:16 -> '6:16 PM'", () => {
    expect(formatTime12h(18, 16)).toBe("6:16 PM");
  });

  test("0:00 -> '12:00 AM'", () => {
    expect(formatTime12h(0, 0)).toBe("12:00 AM");
  });

  test("12:00 -> '12:00 PM'", () => {
    expect(formatTime12h(12, 0)).toBe("12:00 PM");
  });

  test("1:05 -> '1:05 AM'", () => {
    expect(formatTime12h(1, 5)).toBe("1:05 AM");
  });

  test("13:00 -> '1:00 PM'", () => {
    expect(formatTime12h(13, 0)).toBe("1:00 PM");
  });

  test("23:59 -> '11:59 PM'", () => {
    expect(formatTime12h(23, 59)).toBe("11:59 PM");
  });
});

describe("humanizeSchedule", () => {
  test("StartInterval 14400 -> contains '4' and 'h'", () => {
    const config: PlistConfig = { Label: "test", StartInterval: 14400 };
    const result = humanizeSchedule(config);
    expect(result).toContain("4");
    expect(result).toContain("h");
  });

  test("StartInterval 60 -> contains '1' and 'm'", () => {
    const config: PlistConfig = { Label: "test", StartInterval: 60 };
    const result = humanizeSchedule(config);
    expect(result).toContain("1");
    expect(result).toContain("m");
  });

  test("StartInterval 3600 -> contains '1h'", () => {
    const config: PlistConfig = { Label: "test", StartInterval: 3600 };
    const result = humanizeSchedule(config);
    expect(result).toContain("1h");
  });

  test("StartInterval 86400 -> contains '1 day'", () => {
    const config: PlistConfig = { Label: "test", StartInterval: 86400 };
    const result = humanizeSchedule(config);
    expect(result).toContain("1 day");
  });

  test("StartCalendarInterval {Hour:18, Minute:16} -> 'Daily at 6:16 PM'", () => {
    const config: PlistConfig = {
      Label: "test",
      StartCalendarInterval: { Hour: 18, Minute: 16 },
    };
    const result = humanizeSchedule(config);
    expect(result).toBe("Daily at 6:16 PM");
  });

  test("StartCalendarInterval {Weekday:1, Hour:9, Minute:0} -> contains 'Mon'", () => {
    const config: PlistConfig = {
      Label: "test",
      StartCalendarInterval: { Weekday: 1, Hour: 9, Minute: 0 },
    };
    const result = humanizeSchedule(config);
    expect(result).toContain("Mon");
  });

  test("StartCalendarInterval with Weekday only -> contains 'Every' and weekday name", () => {
    const config: PlistConfig = {
      Label: "test",
      StartCalendarInterval: { Weekday: 5 },
    };
    const result = humanizeSchedule(config);
    expect(result).toBe("Every Fri");
  });

  test("StartCalendarInterval with Minute only -> hourly", () => {
    const config: PlistConfig = {
      Label: "test",
      StartCalendarInterval: { Minute: 15 },
    };
    const result = humanizeSchedule(config);
    expect(result).toContain("Hourly");
    expect(result).toContain(":15");
  });

  test("Multiple StartCalendarIntervals -> joined with 'or'", () => {
    const config: PlistConfig = {
      Label: "test",
      StartCalendarInterval: [
        { Hour: 9, Minute: 0 },
        { Hour: 17, Minute: 0 },
      ],
    };
    const result = humanizeSchedule(config);
    expect(result).toContain("or");
    expect(result).toContain("9:00 AM");
    expect(result).toContain("5:00 PM");
  });

  test("RunAtLoad only -> 'On load only'", () => {
    const config: PlistConfig = { Label: "test", RunAtLoad: true };
    const result = humanizeSchedule(config);
    expect(result).toBe("On load only");
  });

  test("No schedule -> 'On demand'", () => {
    const config: PlistConfig = { Label: "test" };
    const result = humanizeSchedule(config);
    expect(result).toBe("On demand");
  });

  test("RunAtLoad false with no schedule -> 'On demand'", () => {
    const config: PlistConfig = { Label: "test", RunAtLoad: false };
    const result = humanizeSchedule(config);
    expect(result).toBe("On demand");
  });
});
