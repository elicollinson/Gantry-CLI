import React, { useState, useMemo, useEffect } from "react";
import { Box, Text, useStdout } from "ink";
import type { LaunchJob } from "../types.ts";
import { JobRow, type ColumnWidths } from "./job-row.tsx";

const RESERVED_LINES = 6; // header + filter bar + column header + footer + borders

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

  // Keep selected item visible within the viewport
  useEffect(() => {
    setScrollOffset((prev) => {
      if (selectedIndex < prev) {
        return selectedIndex;
      }
      if (selectedIndex >= prev + visibleRows) {
        return selectedIndex - visibleRows + 1;
      }
      return prev;
    });
  }, [selectedIndex, visibleRows]);

  const columns: ColumnWidths = useMemo(() => {
    const status = 5;
    const schedule = 20;
    const nextRun = 14;
    const exit = 14;
    const prefix = 2; // "> " prefix
    const label = Math.max(
      10,
      termWidth - status - schedule - nextRun - exit - prefix
    );
    return { status, label, schedule, nextRun, exit };
  }, [termWidth]);

  const visibleJobs = jobs.slice(scrollOffset, scrollOffset + visibleRows);
  const hasAbove = scrollOffset > 0;
  const hasBelow = scrollOffset + visibleRows < jobs.length;

  if (jobs.length === 0) {
    return (
      <Box paddingLeft={1} paddingTop={1}>
        <Text dimColor>No jobs match the current filters.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Column headers */}
      <Box>
        <Text>  </Text>
        <Box width={columns.status}>
          <Text bold dimColor>
            ST
          </Text>
        </Box>
        <Box width={columns.label}>
          <Text bold dimColor>
            LABEL
          </Text>
        </Box>
        <Box width={columns.schedule}>
          <Text bold dimColor>
            SCHEDULE
          </Text>
        </Box>
        <Box width={columns.nextRun}>
          <Text bold dimColor>
            NEXT RUN
          </Text>
        </Box>
        <Box width={columns.exit}>
          <Text bold dimColor>
            EXIT
          </Text>
        </Box>
      </Box>

      {/* Scroll indicator above */}
      {hasAbove && (
        <Text dimColor>  {"\u25B2"} {scrollOffset} more above</Text>
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
        <Text dimColor>
          {"  \u25BC"} {jobs.length - scrollOffset - visibleRows} more below
        </Text>
      )}
    </Box>
  );
}
