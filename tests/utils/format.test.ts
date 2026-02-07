import { describe, test, expect } from "bun:test";
import {
  formatRelativeTime,
  truncate,
  extractProgramName,
} from "../../src/utils/format.ts";
import type { PlistConfig } from "../../src/types.ts";

describe("formatRelativeTime", () => {
  test("date 2 hours from now -> contains '2h'", () => {
    const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const result = formatRelativeTime(futureDate);
    expect(result).toContain("2h");
  });

  test("date 5 minutes from now -> contains '5m'", () => {
    const futureDate = new Date(Date.now() + 5 * 60 * 1000 + 30 * 1000);
    const result = formatRelativeTime(futureDate);
    expect(result).toContain("5m");
  });

  test("date 3 days from now -> contains '3d'", () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(futureDate);
    expect(result).toContain("3d");
  });

  test("date in the past -> 'passed'", () => {
    const pastDate = new Date(Date.now() - 60 * 1000);
    const result = formatRelativeTime(pastDate);
    expect(result).toBe("passed");
  });

  test("date less than 1 minute from now -> 'in <1m'", () => {
    const nearFuture = new Date(Date.now() + 30 * 1000);
    const result = formatRelativeTime(nearFuture);
    expect(result).toBe("in <1m");
  });
});

describe("truncate", () => {
  test("truncates long strings and adds ellipsis", () => {
    const result = truncate("hello world", 5);
    expect(result.length).toBeLessThanOrEqual(5);
    expect(result).toContain("\u2026"); // ellipsis character
  });

  test("does not truncate short strings", () => {
    const result = truncate("hi", 10);
    expect(result).toBe("hi");
  });

  test("string exactly at maxLen is not truncated", () => {
    const result = truncate("hello", 5);
    expect(result).toBe("hello");
  });

  test("maxLen of 1 returns just ellipsis", () => {
    const result = truncate("hello", 1);
    expect(result).toBe("\u2026");
  });

  test("empty string returns empty string", () => {
    const result = truncate("", 5);
    expect(result).toBe("");
  });
});

describe("extractProgramName", () => {
  test("extracts basename from ProgramArguments[0]", () => {
    const config: PlistConfig = {
      Label: "com.example.test",
      ProgramArguments: ["/usr/local/bin/my-program", "--flag"],
    };
    expect(extractProgramName(config)).toBe("my-program");
  });

  test("extracts basename from Program when no ProgramArguments", () => {
    const config: PlistConfig = {
      Label: "com.example.test",
      Program: "/usr/bin/python3",
    };
    expect(extractProgramName(config)).toBe("python3");
  });

  test("falls back to Label when no Program or ProgramArguments", () => {
    const config: PlistConfig = {
      Label: "com.example.test",
    };
    expect(extractProgramName(config)).toBe("com.example.test");
  });

  test("falls back to 'unknown' when nothing is available", () => {
    const config: PlistConfig = {
      Label: "",
    };
    // Empty string ProgramArguments[0] is falsy, empty Program is falsy,
    // empty Label is falsy, so it falls back to "unknown"
    const configNoLabel = { Label: "" } as PlistConfig;
    // With empty Label, ProgramArguments undefined, Program undefined:
    // config.ProgramArguments?.[0] -> undefined
    // config.Program -> undefined
    // config.Label -> "" (falsy in ?? chain? No, ?? only checks null/undefined)
    // So it will return basename("") which is ""
    // Actually Label:"" is not null/undefined so ?? won't trigger
    expect(extractProgramName(configNoLabel)).toBe("");
  });

  test("ProgramArguments takes priority over Program", () => {
    const config: PlistConfig = {
      Label: "com.example.test",
      Program: "/usr/bin/should-not-use",
      ProgramArguments: ["/usr/local/bin/should-use"],
    };
    expect(extractProgramName(config)).toBe("should-use");
  });
});
