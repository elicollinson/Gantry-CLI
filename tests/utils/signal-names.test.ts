import { describe, test, expect } from "bun:test";
import { interpretExitCode } from "../../src/utils/signal-names.ts";

describe("interpretExitCode", () => {
  test("null -> 'Never run'", () => {
    expect(interpretExitCode(null)).toBe("Never run");
  });

  test("0 -> 'Success'", () => {
    expect(interpretExitCode(0)).toBe("Success");
  });

  test("-9 -> 'SIGKILL'", () => {
    expect(interpretExitCode(-9)).toBe("SIGKILL");
  });

  test("-15 -> 'SIGTERM'", () => {
    expect(interpretExitCode(-15)).toBe("SIGTERM");
  });

  test("-11 -> 'SIGSEGV'", () => {
    expect(interpretExitCode(-11)).toBe("SIGSEGV");
  });

  test("-2 -> 'SIGINT'", () => {
    expect(interpretExitCode(-2)).toBe("SIGINT");
  });

  test("-6 -> 'SIGABRT'", () => {
    expect(interpretExitCode(-6)).toBe("SIGABRT");
  });

  test("1 -> 'Error (1)'", () => {
    expect(interpretExitCode(1)).toBe("Error (1)");
  });

  test("127 -> 'Error (127)'", () => {
    expect(interpretExitCode(127)).toBe("Error (127)");
  });

  test("unknown negative signal -> 'Signal N'", () => {
    expect(interpretExitCode(-99)).toBe("Signal 99");
  });
});
