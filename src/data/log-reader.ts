/**
 * Reads the last N lines of a log file using Bun.file().
 * Returns null if the file doesn't exist or is unreadable (permission denied, etc.).
 */
export async function readLogTail(
  logPath: string,
  lines: number = 50
): Promise<string | null> {
  try {
    const file = Bun.file(logPath);

    // Check if file exists
    const exists = await file.exists();
    if (!exists) {
      return null;
    }

    const content = await file.text();

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
