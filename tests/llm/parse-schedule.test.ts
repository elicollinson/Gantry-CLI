import { describe, test, expect } from "bun:test";
import { extractJSON, validateSchedule } from "../../src/llm/parse-schedule.ts";

describe("extractJSON", () => {
  test("extracts clean JSON", () => {
    const input = '{"type": "interval", "startInterval": 300}';
    expect(extractJSON(input)).toBe('{"type": "interval", "startInterval": 300}');
  });

  test("extracts JSON from markdown code fence", () => {
    const input = '```json\n{"type": "interval", "startInterval": 300}\n```';
    expect(extractJSON(input)).toBe('{"type": "interval", "startInterval": 300}');
  });

  test("extracts JSON from fence without language tag", () => {
    const input = '```\n{"type": "calendar", "calendarIntervals": [{"Hour": 9}]}\n```';
    expect(extractJSON(input)).toBe('{"type": "calendar", "calendarIntervals": [{"Hour": 9}]}');
  });

  test("trims whitespace", () => {
    const input = '  {"type": "interval", "startInterval": 60}  ';
    expect(extractJSON(input)).toBe('{"type": "interval", "startInterval": 60}');
  });
});

describe("validateSchedule", () => {
  test("validates interval schedule", () => {
    const result = validateSchedule({ type: "interval", startInterval: 300 });
    expect(result).toEqual({ type: "interval", startInterval: 300 });
  });

  test("validates calendar schedule", () => {
    const result = validateSchedule({
      type: "calendar",
      calendarIntervals: [{ Hour: 9, Minute: 0 }],
    });
    expect(result).toEqual({
      type: "calendar",
      calendarIntervals: [{ Hour: 9, Minute: 0 }],
    });
  });

  test("validates calendar with weekday", () => {
    const result = validateSchedule({
      type: "calendar",
      calendarIntervals: [{ Weekday: 1, Hour: 8, Minute: 0 }],
    });
    expect(result).toEqual({
      type: "calendar",
      calendarIntervals: [{ Weekday: 1, Hour: 8, Minute: 0 }],
    });
  });

  test("rejects invalid type", () => {
    expect(validateSchedule({ type: "bogus" })).toBeNull();
  });

  test("rejects interval with zero seconds", () => {
    expect(validateSchedule({ type: "interval", startInterval: 0 })).toBeNull();
  });

  test("rejects interval with negative seconds", () => {
    expect(validateSchedule({ type: "interval", startInterval: -60 })).toBeNull();
  });

  test("rejects calendar with out-of-range Hour", () => {
    expect(
      validateSchedule({
        type: "calendar",
        calendarIntervals: [{ Hour: 25 }],
      }),
    ).toBeNull();
  });

  test("rejects calendar with out-of-range Minute", () => {
    expect(
      validateSchedule({
        type: "calendar",
        calendarIntervals: [{ Minute: 60 }],
      }),
    ).toBeNull();
  });

  test("rejects calendar with out-of-range Weekday", () => {
    expect(
      validateSchedule({
        type: "calendar",
        calendarIntervals: [{ Weekday: 7 }],
      }),
    ).toBeNull();
  });

  test("rejects calendar with out-of-range Month", () => {
    expect(
      validateSchedule({
        type: "calendar",
        calendarIntervals: [{ Month: 13 }],
      }),
    ).toBeNull();
  });

  test("rejects calendar with out-of-range Day", () => {
    expect(
      validateSchedule({
        type: "calendar",
        calendarIntervals: [{ Day: 32 }],
      }),
    ).toBeNull();
  });

  test("rejects empty calendarIntervals", () => {
    expect(
      validateSchedule({ type: "calendar", calendarIntervals: [] }),
    ).toBeNull();
  });

  test("rejects null input", () => {
    expect(validateSchedule(null)).toBeNull();
  });

  test("rejects non-object", () => {
    expect(validateSchedule("string")).toBeNull();
  });
});
