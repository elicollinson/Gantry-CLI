import React from "react";
import { Box, Text } from "ink";
import type { LaunchJob } from "../types.ts";
import { StatusBadge } from "./status-badge.tsx";
import { formatRelativeTime, truncate } from "../utils/format.ts";

export type ColumnWidths = {
  status: number;
  label: number;
  schedule: number;
  nextRun: number;
  exit: number;
};

function scheduleColor(type: string): string | undefined {
  switch (type) {
    case "calendar":
      return "cyan";
    case "interval":
      return "blue";
    default:
      return undefined;
  }
}

function nextRunColor(nextRun: Date | null): string | undefined {
  if (!nextRun) return undefined;
  const diffMs = nextRun.getTime() - Date.now();
  const diffMin = diffMs / 60_000;
  if (diffMin < 30) return "yellow";
  if (diffMin < 120) return "white";
  return undefined;
}

function exitColor(code: number | null): string | undefined {
  if (code === null) return undefined;
  if (code === 0) return "green";
  if (code < 0) {
    const sig = Math.abs(code);
    if (sig === 9 || sig === 15) return "yellow";
    return "red";
  }
  return "red";
}

export function JobRow({
  job,
  isSelected,
  columns,
}: {
  job: LaunchJob;
  isSelected: boolean;
  columns: ColumnWidths;
}) {
  const nextRunText = job.schedule.nextRun
    ? formatRelativeTime(job.schedule.nextRun)
    : "\u2014";

  return (
    <Box>
      <Text inverse={isSelected}>{isSelected ? " \u25B8" : "  "}</Text>
      <Box width={columns.status}>
        <Text inverse={isSelected}>
          {isSelected ? " " : ""}
        </Text>
        <StatusBadge health={job.health} isRunning={job.isRunning} />
      </Box>
      <Box width={columns.label}>
        <Text bold={isSelected} inverse={isSelected}>
          {truncate(job.label, columns.label - 1)}
          {isSelected ? " ".repeat(Math.max(0, columns.label - 1 - job.label.length)) : ""}
        </Text>
      </Box>
      <Box width={columns.schedule}>
        <Text
          color={isSelected ? undefined : scheduleColor(job.schedule.type)}
          dimColor={!isSelected && job.schedule.type === "on-demand"}
          inverse={isSelected}
        >
          {truncate(job.schedule.humanReadable, columns.schedule - 1)}
          {isSelected ? " ".repeat(Math.max(0, columns.schedule - 1 - job.schedule.humanReadable.length)) : ""}
        </Text>
      </Box>
      <Box width={columns.nextRun}>
        <Text
          color={isSelected ? undefined : nextRunColor(job.schedule.nextRun)}
          dimColor={!isSelected && !job.schedule.nextRun}
          inverse={isSelected}
        >
          {truncate(nextRunText, columns.nextRun - 1)}
          {isSelected ? " ".repeat(Math.max(0, columns.nextRun - 1 - nextRunText.length)) : ""}
        </Text>
      </Box>
      <Box width={columns.exit}>
        <Text
          color={isSelected ? undefined : exitColor(job.lastExitCode)}
          dimColor={!isSelected && job.lastExitCode === null}
          inverse={isSelected}
        >
          {truncate(job.exitCodeMeaning, columns.exit - 1)}
          {isSelected ? " ".repeat(Math.max(0, columns.exit - 1 - job.exitCodeMeaning.length)) : ""}
        </Text>
      </Box>
    </Box>
  );
}
