import React from "react";
import { Box, Text } from "ink";
import type { LaunchJob } from "../types.ts";
import { useJobDetail } from "../hooks/use-job-detail.ts";
import { StatusBadge } from "./status-badge.tsx";
import { LogViewer } from "./log-viewer.tsx";
import { formatRelativeTime } from "../utils/format.ts";
import { interpretExitCode } from "../utils/signal-names.ts";

export function JobDetail({ job }: { job: LaunchJob }) {
  const { printInfo, logContent, loading } = useJobDetail(job.label);

  const exitMeaning = printInfo
    ? interpretExitCode(printInfo.lastExitCode)
    : job.exitCodeMeaning;

  const fullCommand = printInfo
    ? [printInfo.program, ...printInfo.arguments].filter(Boolean).join(" ")
    : job.programFull;

  const logPath =
    printInfo?.stdoutPath ??
    printInfo?.stderrPath ??
    job.logPaths.stdout ??
    job.logPaths.stderr;

  const hasLogs = Boolean(logPath);

  return (
    <Box flexDirection="column" paddingLeft={1} paddingRight={1}>
      {/* Identity */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="cyan">
          Identity
        </Text>
        <Text>
          <Text dimColor>Label: </Text>
          {job.label}
        </Text>
        <Text>
          <Text dimColor>Source: </Text>
          {job.source}
        </Text>
        <Text>
          <Text dimColor>Plist: </Text>
          {job.plistPath}
        </Text>
      </Box>

      {/* Status */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="cyan">
          Status
        </Text>
        <Box>
          <Text dimColor>Health: </Text>
          <StatusBadge health={job.health} isRunning={job.isRunning} />
          <Text> {job.health}</Text>
        </Box>
        <Text>
          <Text dimColor>Running: </Text>
          {job.isRunning ? "Yes" : "No"}
          {job.pid != null && <Text> (PID {job.pid})</Text>}
        </Text>
        <Text>
          <Text dimColor>Exit: </Text>
          <Text color={job.lastExitCode && job.lastExitCode !== 0 ? "red" : undefined}>
            {exitMeaning}
          </Text>
        </Text>
        {printInfo && (
          <Text>
            <Text dimColor>Runs: </Text>
            {printInfo.runs}
          </Text>
        )}
      </Box>

      {/* Program */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="cyan">
          Program
        </Text>
        <Text wrap="wrap">{fullCommand}</Text>
      </Box>

      {/* Schedule */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold color="cyan">
          Schedule
        </Text>
        <Text>
          <Text dimColor>Type: </Text>
          {job.schedule.type}
        </Text>
        <Text>
          <Text dimColor>Description: </Text>
          {job.schedule.humanReadable}
        </Text>
        <Text>
          <Text dimColor>Next run: </Text>
          {job.schedule.nextRun
            ? formatRelativeTime(job.schedule.nextRun)
            : "-"}
        </Text>
      </Box>

      {/* Logs */}
      <Box flexDirection="column">
        <Text bold color="cyan">
          Logs
        </Text>
        {hasLogs ? (
          <LogViewer content={logContent} path={logPath} loading={loading} />
        ) : (
          <Text dimColor> No log files configured</Text>
        )}
      </Box>
    </Box>
  );
}
