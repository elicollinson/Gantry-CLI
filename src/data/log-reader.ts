import { readFile, access } from "node:fs/promises";

/**
 * Reads the last N lines of a log file.
 * Returns null if the file doesn't exist or is unreadable (permission denied, etc.).
 */
export async function readLogTail(
  logPath: string,
  lines: number = 50
): Promise<string | null> {
  try {
    await access(logPath);

    const content = await readFile(logPath, "utf-8");

    if (!content) {
      return "";
    }

    const allLines = content.split("\n");

    // Take the last N lines, preserving a trailing newline if present
    const tail = allLines.slice(-lines).join("\n");
    return tail;
  } catch {
    // Permission denied, file disappeared, or other I/O error
    return null;
  }
}
