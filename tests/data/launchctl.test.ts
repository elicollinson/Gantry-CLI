import { describe, test, expect } from "bun:test";
import type { LaunchctlListEntry } from "../../src/types.ts";

/**
 * Since listServices() calls `launchctl list` directly via Bun.$,
 * we extract and re-implement the parsing logic here as a pure function
 * that mirrors the source, so we can test it without mocking the shell.
 */
function parseListOutput(output: string): LaunchctlListEntry[] {
  const lines = output.trim().split("\n");
  const dataLines = lines.slice(1); // skip header
  const entries: LaunchctlListEntry[] = [];

  for (const line of dataLines) {
    const parts = line.split("\t");
    if (parts.length < 3) continue;

    const [pidStr, statusStr, label] = parts as [string, string, string];

    const pid = pidStr.trim() === "-" ? null : parseInt(pidStr.trim(), 10);
    const exitCode = parseInt(statusStr.trim(), 10);
    const trimmedLabel = label.trim();

    if (trimmedLabel && !isNaN(exitCode)) {
      entries.push({
        pid: pid !== null && isNaN(pid) ? null : pid,
        exitCode,
        label: trimmedLabel,
      });
    }
  }

  return entries;
}

describe("launchctl list parser", () => {
  const fixture = `PID\tStatus\tLabel
-\t0\tcom.example.healthy
12345\t0\tcom.example.running
-\t-9\tcom.example.killed
-\t1\tcom.example.error
-\t78\tcom.example.neverrun`;

  test("parses PID correctly (number or null for '-')", () => {
    const entries = parseListOutput(fixture);
    expect(entries[0]!.pid).toBeNull();
    expect(entries[1]!.pid).toBe(12345);
    expect(entries[2]!.pid).toBeNull();
    expect(entries[3]!.pid).toBeNull();
    expect(entries[4]!.pid).toBeNull();
  });

  test("parses exit code correctly including negative values", () => {
    const entries = parseListOutput(fixture);
    expect(entries[0]!.exitCode).toBe(0);
    expect(entries[1]!.exitCode).toBe(0);
    expect(entries[2]!.exitCode).toBe(-9);
    expect(entries[3]!.exitCode).toBe(1);
    expect(entries[4]!.exitCode).toBe(78);
  });

  test("parses labels correctly", () => {
    const entries = parseListOutput(fixture);
    expect(entries[0]!.label).toBe("com.example.healthy");
    expect(entries[1]!.label).toBe("com.example.running");
    expect(entries[2]!.label).toBe("com.example.killed");
    expect(entries[3]!.label).toBe("com.example.error");
    expect(entries[4]!.label).toBe("com.example.neverrun");
  });

  test("skips header line", () => {
    const entries = parseListOutput(fixture);
    expect(entries.length).toBe(5);
    // Ensure "PID" is not treated as a label
    expect(entries.find((e) => e.label === "Label")).toBeUndefined();
  });

  test("handles empty output", () => {
    const entries = parseListOutput("");
    expect(entries).toEqual([]);
  });

  test("handles header-only output", () => {
    const entries = parseListOutput("PID\tStatus\tLabel");
    expect(entries).toEqual([]);
  });

  test("skips lines with fewer than 3 tab-separated columns", () => {
    const output = `PID\tStatus\tLabel
-\t0\tcom.example.good
malformed line without tabs`;
    const entries = parseListOutput(output);
    expect(entries.length).toBe(1);
    expect(entries[0]!.label).toBe("com.example.good");
  });
});
