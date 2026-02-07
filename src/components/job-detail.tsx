import React from "react";
import { Box, Text, useStdout } from "ink";
import { Spinner } from "@inkjs/ui";
import type { LaunchJob } from "../types.ts";
import type { GantryConfig } from "../config/types.ts";
import { useJobDetail } from "../hooks/use-job-detail.ts";
import { useLogSummary } from "../hooks/use-log-summary.ts";
import { StatusBadge } from "./status-badge.tsx";
import { LogViewer } from "./log-viewer.tsx";
import { formatRelativeTime } from "../utils/format.ts";
import { interpretExitCode } from "../utils/signal-names.ts";

function SectionHeader({ title }: { title: string }) {
  return (
    <Box marginTop={1}>
      <Text bold color="cyan">{"\u2500\u2500 "}{title}{" "}</Text>
    </Box>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Box width={14}>
        <Text dimColor>{label}</Text>
      </Box>
      <Box flexShrink={1}>{children}</Box>
    </Box>
  );
}

export function JobDetail({ job, config }: { job: LaunchJob; config: GantryConfig | null }) {
  const { printInfo, logContent, loading } = useJobDetail(job.label);
  const { summary, loading: summaryLoading } = useLogSummary(job.label, logContent, config);
  const { stdout } = useStdout();
  const width = stdout.columns ?? 80;

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

  const exitColor =
    job.lastExitCode === 0
      ? "green"
      : job.lastExitCode !== null
        ? "red"
        : undefined;

  return (
    <Box flexDirection="column" paddingLeft={1} paddingRight={1}>
      {/* Title */}
      <Box marginBottom={0}>
        <Text bold>{job.label}</Text>
        <Text dimColor> ({job.source})</Text>
      </Box>
      <Text dimColor>{job.plistPath}</Text>

      {/* Status Section */}
      <SectionHeader title="Status" />
      <Field label="Health">
        <StatusBadge health={job.health} isRunning={job.isRunning} />
        <Text> {job.health}</Text>
      </Field>
      <Field label="Running">
        <Text color={job.isRunning ? "green" : undefined}>
          {job.isRunning ? `Yes (PID ${job.pid})` : "No"}
        </Text>
      </Field>
      <Field label="Exit Code">
        <Text color={exitColor}>{exitMeaning}</Text>
      </Field>
      {printInfo && (
        <Field label="Total Runs">
          <Text>{printInfo.runs}</Text>
        </Field>
      )}

      {/* Program Section */}
      <SectionHeader title="Program" />
      <Box paddingLeft={0}>
        <Text wrap="wrap">{fullCommand}</Text>
      </Box>

      {/* Schedule Section */}
      <SectionHeader title="Schedule" />
      <Field label="Type">
        <Text>{job.schedule.type}</Text>
      </Field>
      <Field label="Schedule">
        <Text color="cyan">{job.schedule.humanReadable}</Text>
        {job.source === "user" && (
          <Text dimColor>  (press e to edit)</Text>
        )}
      </Field>
      <Field label="Next Run">
        <Text color={job.schedule.nextRun ? "yellow" : undefined}>
          {job.schedule.nextRun
            ? `${formatRelativeTime(job.schedule.nextRun)}  (${job.schedule.nextRun.toLocaleString()})`
            : "\u2014"}
        </Text>
      </Field>

      {/* AI Summary Section */}
      {(summary || summaryLoading) && (
        <>
          <SectionHeader title="AI Summary" />
          {summaryLoading ? (
            <Spinner label="Generating summary..." />
          ) : (
            <Box paddingLeft={0}>
              <Text wrap="wrap">{summary}</Text>
            </Box>
          )}
        </>
      )}

      {/* Logs Section */}
      <SectionHeader title="Logs" />
      {logPath ? (
        <LogViewer content={logContent} path={logPath} loading={loading} />
      ) : (
        <Text dimColor italic> No log files configured</Text>
      )}
    </Box>
  );
}
