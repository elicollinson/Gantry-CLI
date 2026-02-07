import React from "react";
import { Text } from "ink";
import type { JobHealth } from "../types.ts";
import { HEALTH_COLORS } from "../constants.ts";

const SYMBOLS: Record<JobHealth, string> = {
  healthy: "\u25CF",  // ●
  error: "\u25CF",    // ●
  warning: "\u25B2",  // ▲
  unknown: "\u25CB",  // ○
};

export function StatusBadge({
  health,
  isRunning,
}: {
  health: JobHealth;
  isRunning: boolean;
}) {
  const color = HEALTH_COLORS[health];
  const symbol = SYMBOLS[health];
  const runIndicator = isRunning ? "\u25B6" : " ";

  return (
    <Text color={color}>
      {runIndicator} {symbol}
    </Text>
  );
}
