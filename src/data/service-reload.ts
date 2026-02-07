import { $ } from "bun";

/**
 * Reloads a launchd service after plist modification.
 * Uses bootout/bootstrap (modern API), falls back to unload/load.
 */
export async function reloadService(
  label: string,
  plistPath: string,
): Promise<void> {
  const uid = process.getuid?.();
  if (uid === undefined) {
    throw new Error("Cannot determine user ID");
  }

  const domain = `gui/${uid}`;
  const target = `${domain}/${label}`;

  // Try modern bootout/bootstrap first
  try {
    await $`launchctl bootout ${target}`.quiet().nothrow();
    // Brief pause to let launchd clean up
    await Bun.sleep(500);
    await $`launchctl bootstrap ${domain} ${plistPath}`;
    return;
  } catch {
    // Fall back to legacy unload/load
  }

  try {
    await $`launchctl unload ${plistPath}`.quiet().nothrow();
    await Bun.sleep(500);
    await $`launchctl load ${plistPath}`;
  } catch (error) {
    throw new Error(
      `Failed to reload service: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
