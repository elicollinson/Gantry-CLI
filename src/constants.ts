import { homedir } from "os";

const home = homedir();

export const PLIST_DIRS = [
  { dir: `${home}/Library/LaunchAgents`, source: "user" as const },
  { dir: "/Library/LaunchAgents", source: "system-agent" as const },
  { dir: "/Library/LaunchDaemons", source: "system-daemon" as const },
] as const;

export const REFRESH_INTERVAL_MS = 30_000;

export const HEALTH_COLORS = {
  healthy: "green",
  error: "red",
  warning: "yellow",
  unknown: "gray",
} as const;

export const HEALTH_SYMBOLS = {
  healthy: "\u25CF",  // ●
  error: "\u25CF",    // ●
  warning: "\u25CF",  // ●
  unknown: "\u25CB",  // ○
} as const;
