import { describe, test, expect } from "bun:test";
import { determineHealth } from "../../src/data/collector.ts";

describe("determineHealth", () => {
  test("null exit code + not running -> 'unknown'", () => {
    expect(determineHealth(null, false)).toBe("unknown");
  });

  test("0 exit code + not running -> 'healthy'", () => {
    expect(determineHealth(0, false)).toBe("healthy");
  });

  test("running with exit code 0 -> 'healthy'", () => {
    expect(determineHealth(0, true)).toBe("healthy");
  });

  test("running with non-zero exit code -> 'healthy'", () => {
    expect(determineHealth(1, true)).toBe("healthy");
  });

  test("running with null exit code -> 'healthy'", () => {
    expect(determineHealth(null, true)).toBe("healthy");
  });

  test("-9 (SIGKILL) -> 'warning'", () => {
    expect(determineHealth(-9, false)).toBe("warning");
  });

  test("-15 (SIGTERM) -> 'warning'", () => {
    expect(determineHealth(-15, false)).toBe("warning");
  });

  test("-11 (SIGSEGV) -> 'error'", () => {
    expect(determineHealth(-11, false)).toBe("error");
  });

  test("-6 (SIGABRT) -> 'error'", () => {
    expect(determineHealth(-6, false)).toBe("error");
  });

  test("positive non-zero exit code -> 'error'", () => {
    expect(determineHealth(1, false)).toBe("error");
    expect(determineHealth(127, false)).toBe("error");
    expect(determineHealth(78, false)).toBe("error");
  });
});
