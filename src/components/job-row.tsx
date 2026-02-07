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
    : "-";

  const prefix = isSelected ? ">" : " ";

  return (
    <Box>
      <Text bold={isSelected}>{prefix} </Text>
      <Box width={columns.status}>
        <StatusBadge health={job.health} isRunning={job.isRunning} />
      </Box>
      <Box width={columns.label}>
        <Text bold={isSelected}>{truncate(job.label, columns.label - 1)}</Text>
      </Box>
      <Box width={columns.schedule}>
        <Text dimColor>
          {truncate(job.schedule.humanReadable, columns.schedule - 1)}
        </Text>
      </Box>
      <Box width={columns.nextRun}>
        <Text>{truncate(nextRunText, columns.nextRun - 1)}</Text>
      </Box>
      <Box width={columns.exit}>
        <Text
          color={
            job.lastExitCode === 0 || job.lastExitCode === null
              ? undefined
              : "red"
          }
        >
          {truncate(job.exitCodeMeaning, columns.exit - 1)}
        </Text>
      </Box>
    </Box>
  );
}
