import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir, homedir } from "os";
import { join } from "path";
import { $ } from "bun";
import { backupPlist, writeScheduleToPlist } from "../../src/data/plist-writer.ts";
import { parsePlist } from "../../src/data/plist-parser.ts";
import type { ParsedSchedule } from "../../src/types.ts";

// These tests create temp files that mimic ~/Library/LaunchAgents paths.
// Since plist-writer restricts writes to that directory, we need to create
// actual test plists there. We use a temp subdirectory to avoid conflicts.
let testDir: string;
let testPlist: string;

beforeEach(async () => {
  const agentsDir = join(homedir(), "Library", "LaunchAgents");
  testDir = await mkdtemp(join(agentsDir, ".gantry-test-"));
  testPlist = join(testDir, "com.gantry.test.plist");

  // Create a minimal valid plist
  await $`plutil -create xml1 ${testPlist}`;
  await $`plutil -insert Label -string "com.gantry.test" ${testPlist}`;
  await $`plutil -insert ProgramArguments -json '["echo","hello"]' ${testPlist}`;
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe("backupPlist", () => {
  test("creates a backup file", async () => {
    await backupPlist(testPlist);
    const backupPath = `${testPlist}.gantry-backup`;
    const exists = await Bun.file(backupPath).exists();
    expect(exists).toBe(true);
  });

  test("backup has same content as original", async () => {
    await backupPlist(testPlist);
    const original = await Bun.file(testPlist).text();
    const backup = await Bun.file(`${testPlist}.gantry-backup`).text();
    expect(backup).toBe(original);
  });
});

describe("writeScheduleToPlist", () => {
  test("writes StartInterval", async () => {
    const schedule: ParsedSchedule = {
      type: "interval",
      startInterval: 3600,
    };
    await writeScheduleToPlist(testPlist, schedule);

    const config = await parsePlist(testPlist);
    expect(config.StartInterval).toBe(3600);
    expect(config.StartCalendarInterval).toBeUndefined();
  });

  test("writes single CalendarInterval", async () => {
    const schedule: ParsedSchedule = {
      type: "calendar",
      calendarIntervals: [{ Hour: 9, Minute: 0 }],
    };
    await writeScheduleToPlist(testPlist, schedule);

    const config = await parsePlist(testPlist);
    expect(config.StartInterval).toBeUndefined();
    expect(config.StartCalendarInterval).toEqual({ Hour: 9, Minute: 0 });
  });

  test("writes array of CalendarIntervals", async () => {
    const schedule: ParsedSchedule = {
      type: "calendar",
      calendarIntervals: [
        { Weekday: 1, Hour: 9, Minute: 0 },
        { Weekday: 3, Hour: 9, Minute: 0 },
        { Weekday: 5, Hour: 9, Minute: 0 },
      ],
    };
    await writeScheduleToPlist(testPlist, schedule);

    const config = await parsePlist(testPlist);
    expect(config.StartInterval).toBeUndefined();
    expect(Array.isArray(config.StartCalendarInterval)).toBe(true);
    const intervals = config.StartCalendarInterval as Array<Record<string, number>>;
    expect(intervals).toHaveLength(3);
    expect(intervals[0]).toEqual({ Weekday: 1, Hour: 9, Minute: 0 });
  });

  test("removes old StartInterval when writing CalendarInterval", async () => {
    // First write a StartInterval
    await writeScheduleToPlist(testPlist, {
      type: "interval",
      startInterval: 3600,
    });
    let config = await parsePlist(testPlist);
    expect(config.StartInterval).toBe(3600);

    // Now overwrite with a CalendarInterval
    await writeScheduleToPlist(testPlist, {
      type: "calendar",
      calendarIntervals: [{ Hour: 18, Minute: 0 }],
    });
    config = await parsePlist(testPlist);
    expect(config.StartInterval).toBeUndefined();
    expect(config.StartCalendarInterval).toEqual({ Hour: 18, Minute: 0 });
  });

  test("removes old CalendarInterval when writing StartInterval", async () => {
    // First write a CalendarInterval
    await writeScheduleToPlist(testPlist, {
      type: "calendar",
      calendarIntervals: [{ Hour: 9, Minute: 0 }],
    });

    // Now overwrite with StartInterval
    await writeScheduleToPlist(testPlist, {
      type: "interval",
      startInterval: 7200,
    });
    const config = await parsePlist(testPlist);
    expect(config.StartCalendarInterval).toBeUndefined();
    expect(config.StartInterval).toBe(7200);
  });

  test("preserves existing Label and ProgramArguments", async () => {
    await writeScheduleToPlist(testPlist, {
      type: "interval",
      startInterval: 600,
    });
    const config = await parsePlist(testPlist);
    expect(config.Label).toBe("com.gantry.test");
    expect(config.ProgramArguments).toEqual(["echo", "hello"]);
  });
});
