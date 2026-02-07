import React, { useState, useMemo, useEffect } from "react";
import { Box, Text, useStdout } from "ink";
import type { LaunchJob } from "../types.ts";
import { JobRow, type ColumnWidths } from "./job-row.tsx";

const RESERVED_LINES = 8; // header(2) + filter + col header + separator + footer(2) + scroll indicators

export function JobList({
  jobs,
  selectedIndex,
}: {
  jobs: LaunchJob[];
  selectedIndex: number;
}) {
  const { stdout } = useStdout();
  const termWidth = stdout.columns ?? 80;
  const termHeight = stdout.rows ?? 24;

  const visibleRows = Math.max(1, termHeight - RESERVED_LINES);

  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    setScrollOffset((prev) => {
      if (selectedIndex < prev) return selectedIndex;
      if (selectedIndex >= prev + visibleRows) return selectedIndex - visibleRows + 1;
      return prev;
    });
  }, [selectedIndex, visibleRows]);

  const columns: ColumnWidths = useMemo(() => {
    const status = 5;
    const schedule = 22;
    const nextRun = 14;
    const exit = 12;
    const prefix = 2;
    const label = Math.max(10, termWidth - status - schedule - nextRun - exit - prefix);
    return { status, label, schedule, nextRun, exit };
  }, [termWidth]);

  const visibleJobs = jobs.slice(scrollOffset, scrollOffset + visibleRows);
  const hasAbove = scrollOffset > 0;
  const hasBelow = scrollOffset + visibleRows < jobs.length;

  if (jobs.length === 0) {
    return (
      <Box paddingLeft={2} paddingTop={1}>
        <Text dimColor italic>No jobs match the current filters.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Column headers */}
      <Box>
        <Text dimColor>{"  "}</Text>
        <Box width={columns.status}>
          <Text dimColor bold>{" "}</Text>
        </Box>
        <Box width={columns.label}>
          <Text dimColor bold>LABEL</Text>
        </Box>
        <Box width={columns.schedule}>
          <Text dimColor bold>SCHEDULE</Text>
        </Box>
        <Box width={columns.nextRun}>
          <Text dimColor bold>NEXT RUN</Text>
        </Box>
        <Box width={columns.exit}>
          <Text dimColor bold>STATUS</Text>
        </Box>
      </Box>

      {/* Scroll indicator above */}
      {hasAbove && (
        <Text dimColor>{"  \u25B4 "}{scrollOffset} more</Text>
      )}

      {/* Visible job rows */}
      {visibleJobs.map((job, i) => (
        <JobRow
          key={job.plistPath}
          job={job}
          isSelected={scrollOffset + i === selectedIndex}
          columns={columns}
        />
      ))}

      {/* Scroll indicator below */}
      {hasBelow && (
        <Text dimColor>{"  \u25BE "}{jobs.length - scrollOffset - visibleRows} more</Text>
      )}
    </Box>
  );
}
