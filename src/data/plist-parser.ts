import { exec } from "../utils/exec.ts";
import type { PlistConfig } from "../types.ts";

/**
 * Parses a .plist file by converting it to JSON via plutil and returning typed config.
 * Handles errors gracefully (permission denied, invalid plist, missing file).
 */
export async function parsePlist(plistPath: string): Promise<PlistConfig> {
  try {
    const result = await exec("plutil", ["-convert", "json", "-o", "-", plistPath]);
    const parsed = JSON.parse(result) as PlistConfig;
    return parsed;
  } catch (error) {
    // Return a minimal config with the path as the label so the job still shows up
    const fallbackLabel = plistPath
      .split("/")
      .pop()
      ?.replace(/\.plist$/, "") ?? "unknown";

    return {
      Label: fallbackLabel,
    };
  }
}
