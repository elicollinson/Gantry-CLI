import { readdir } from "fs/promises";
import { join } from "path";
import type {
  LaunchJob,
  LaunchctlListEntry,
  PlistConfig,
  JobHealth,
} from "../types.ts";
import { PLIST_DIRS } from "../constants.ts";
import { listServices } from "./launchctl.ts";
import { parsePlist } from "./plist-parser.ts";
import { interpretExitCode } from "../utils/signal-names.ts";
import { extractProgramName } from "../utils/format.ts";
import { computeSchedule } from "../schedule/index.ts";

export function determineHealth(
  exitCode: number | null,
  isRunning: boolean
): JobHealth {
  if (isRunning) return "healthy";
  if (exitCode === null) return "unknown";
  if (exitCode === 0) return "healthy";
  if (exitCode < 0) {
    const signalNum = Math.abs(exitCode);
    if (signalNum === 9 || signalNum === 15) return "warning";
    return "error";
  }
  return "error";
}

/**
 * Determines the source type for a plist directory path.
 */
function sourceForDir(dir: string): LaunchJob["source"] {
  const entry = PLIST_DIRS.find((d) => d.dir === dir);
  return entry?.source ?? "user";
}

/**
 * Collects all launch jobs by:
 * 1. Getting live status from `launchctl list`
 * 2. Scanning plist directories for .plist files
 * 3. Parsing each plist file
 * 4. Matching live status entries to plist configs
 * 5. Computing schedule, health, and display fields
 *
 * Returns LaunchJob[] sorted by label.
 */
export async function collectJobs(): Promise<LaunchJob[]> {
  // Step 1: Get live service status
  const liveEntries = await listServices();
  const liveMap = new Map<string, LaunchctlListEntry>();
  for (const entry of liveEntries) {
    liveMap.set(entry.label, entry);
  }

  // Step 2: Scan plist directories and parse plist files
  const jobs: LaunchJob[] = [];

  for (const { dir, source } of PLIST_DIRS) {
    let files: string[];
    try {
      files = await readdir(dir);
    } catch {
      // Directory doesn't exist or permission denied - skip it
      continue;
    }

    const plistFiles = files.filter((f) => f.endsWith(".plist"));

    // Parse all plist files in this directory concurrently
    const parseResults = await Promise.allSettled(
      plistFiles.map(async (filename) => {
        const plistPath = join(dir, filename);
        const config = await parsePlist(plistPath);
        return { plistPath, config, source };
      })
    );

    for (const result of parseResults) {
      if (result.status !== "fulfilled") continue;

      const { plistPath, config, source: jobSource } = result.value;
      const label = config.Label;

      // Skip plist files without a Label
      if (!label) continue;

      // Match with live launchctl list entry
      const liveEntry = liveMap.get(label);
      const isRunning = liveEntry?.pid != null;
      const pid = liveEntry?.pid ?? null;
      const lastExitCode = liveEntry?.exitCode ?? null;

      // Compute derived fields
      const health = determineHealth(lastExitCode, isRunning);
      const schedule = await computeSchedule(config);
      const programShort = extractProgramName(config);
      const programFull =
        config.ProgramArguments?.[0] ?? config.Program ?? label ?? "unknown";

      jobs.push({
        label,
        source: jobSource,
        plistPath,
        isRunning,
        pid,
        lastExitCode,
        exitCodeMeaning: interpretExitCode(lastExitCode),
        runs: 0, // Will be populated by print-parser if detail view is opened
        health,
        schedule,
        program: programShort,
        programFull,
        logPaths: {
          stdout: config.StandardOutPath,
          stderr: config.StandardErrorPath,
        },
        config,
      });

      // Remove from map so we can track unmatched live entries
      liveMap.delete(label);
    }
  }

  // Deduplicate by label (same label can appear in multiple plist dirs).
  // Prefer the copy that is running, then the one with a known exit code, then user source.
  const deduped = new Map<string, LaunchJob>();
  for (const job of jobs) {
    const existing = deduped.get(job.label);
    if (!existing) {
      deduped.set(job.label, job);
      continue;
    }
    const prefer =
      job.isRunning && !existing.isRunning
        ? job
        : !job.isRunning && existing.isRunning
          ? existing
          : job.lastExitCode !== null && existing.lastExitCode === null
            ? job
            : existing;
    deduped.set(job.label, prefer);
  }

  const result = Array.from(deduped.values());
  result.sort((a, b) => a.label.localeCompare(b.label));

  return result;
}
