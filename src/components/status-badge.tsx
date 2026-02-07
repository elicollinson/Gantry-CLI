import React from "react";
import { Text } from "ink";
import type { JobHealth } from "../types.ts";
import { HEALTH_COLORS, HEALTH_SYMBOLS } from "../constants.ts";

export function StatusBadge({
  health,
  isRunning,
}: {
  health: JobHealth;
  isRunning: boolean;
}) {
  const color = HEALTH_COLORS[health];
  const symbol = HEALTH_SYMBOLS[health];
  const runIndicator = isRunning ? "\u25B6" : " ";

  return (
    <Text color={color}>
      {runIndicator} {symbol}
    </Text>
  );
}
