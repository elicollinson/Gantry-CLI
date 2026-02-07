import React, { useCallback } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { TextInput, Spinner } from "@inkjs/ui";
import type { LaunchJob } from "../types.ts";
import { useEditSchedule } from "../hooks/use-edit-schedule.ts";
import { formatRelativeTime } from "../utils/format.ts";

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

export function ScheduleEditor({
  job,
  onDone,
}: {
  job: LaunchJob;
  onDone: () => void;
}) {
  const { editState, setInputText, toggleInputMode, confirm, apply, cancel } =
    useEditSchedule(job);

  const handleDone = useCallback(() => {
    cancel();
    onDone();
  }, [cancel, onDone]);

  useInput(
    (input, key) => {
      if (editState.phase === "input") {
        if (key.escape) {
          handleDone();
          return;
        }
        if (key.tab) {
          toggleInputMode();
          return;
        }
        if (key.return && editState.parseResult?.ok) {
          confirm();
          return;
        }
      }

      if (editState.phase === "confirm") {
        if (key.escape || input === "n") {
          cancel();
          return;
        }
        if (input === "y") {
          apply();
          return;
        }
      }

      if (editState.phase === "success" || editState.phase === "error") {
        // Any key returns to detail view
        handleDone();
        return;
      }
    },
  );

  const { stdout } = useStdout();
  const width = stdout.columns ?? 80;

  if (editState.phase === "applying") {
    return (
      <Box flexDirection="column" paddingLeft={1} paddingRight={1}>
        <Text bold color="cyan">{"\u2500\u2500 Edit Schedule \u2500\u2500"}</Text>
        <Box marginTop={1}>
          <Spinner label="Applying schedule change..." />
        </Box>
      </Box>
    );
  }

  if (editState.phase === "success") {
    return (
      <Box flexDirection="column" paddingLeft={1} paddingRight={1}>
        <Text bold color="cyan">{"\u2500\u2500 Edit Schedule \u2500\u2500"}</Text>
        <Box marginTop={1}>
          <Text color="green" bold>Success!</Text>
          <Text> Schedule updated and service reloaded.</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press any key to return</Text>
        </Box>
      </Box>
    );
  }

  if (editState.phase === "error") {
    return (
      <Box flexDirection="column" paddingLeft={1} paddingRight={1}>
        <Text bold color="cyan">{"\u2500\u2500 Edit Schedule \u2500\u2500"}</Text>
        <Box marginTop={1} flexDirection="column">
          <Text color="red" bold>Error</Text>
          <Text color="red">{editState.errorMessage ?? "Unknown error"}</Text>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>Press any key to return</Text>
        </Box>
      </Box>
    );
  }

  if (editState.phase === "confirm") {
    return (
      <Box flexDirection="column" paddingLeft={1} paddingRight={1}>
        <Text bold color="cyan">{"\u2500\u2500 Confirm Schedule Change \u2500\u2500"}</Text>
        <Text dimColor>{job.label}</Text>

        <Box marginTop={1} flexDirection="column">
          <Field label="Before">
            <Text color="red">{job.schedule.humanReadable}</Text>
          </Field>
          <Field label="After">
            <Text color="green">{editState.parseResult?.humanReadable ?? ""}</Text>
          </Field>
          {editState.parseResult?.nextRun && (
            <Field label="Next Run">
              <Text color="yellow">
                {formatRelativeTime(editState.parseResult.nextRun)}
                {"  "}({editState.parseResult.nextRun.toLocaleString()})
              </Text>
            </Field>
          )}
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text dimColor>Plist: {job.plistPath}</Text>
          <Text dimColor>A backup will be created before modifying.</Text>
        </Box>

        <Box marginTop={1}>
          <Text bold>Apply this change? </Text>
          <Text color="green">y</Text>
          <Text dimColor>/</Text>
          <Text color="red">n</Text>
        </Box>
      </Box>
    );
  }

  // Input phase
  const modeLabel =
    editState.inputMode === "natural" ? "Natural language" : "Cron expression";

  const placeholder =
    editState.inputMode === "natural"
      ? "daily at 9:00 AM"
      : "0 9 * * *";

  return (
    <Box flexDirection="column" paddingLeft={1} paddingRight={1}>
      <Text bold color="cyan">{"\u2500\u2500 Edit Schedule \u2500\u2500"}</Text>
      <Text dimColor>{job.label}</Text>

      <Box marginTop={1} flexDirection="column">
        <Field label="Current">
          <Text color="cyan">{job.schedule.humanReadable}</Text>
        </Field>
        <Field label="Mode">
          <Text color="yellow">[{modeLabel}]</Text>
          <Text dimColor>  (tab to switch)</Text>
        </Field>
      </Box>

      <Box marginTop={1}>
        <Box width={14}>
          <Text dimColor>Schedule</Text>
        </Box>
        <Text color="cyan" bold>{">"} </Text>
        <TextInput
          placeholder={placeholder}
          onChange={setInputText}
        />
      </Box>

      {/* Live preview */}
      {editState.parseResult && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="cyan">{"\u2500\u2500 Preview \u2500\u2500"}</Text>
          {editState.parseResult.ok ? (
            <>
              <Field label="Parsed">
                <Text color="green">{editState.parseResult.humanReadable}</Text>
              </Field>
              {editState.parseResult.nextRun && (
                <Field label="Next Run">
                  <Text color="yellow">
                    {formatRelativeTime(editState.parseResult.nextRun)}
                    {"  "}({editState.parseResult.nextRun.toLocaleString()})
                  </Text>
                </Field>
              )}
            </>
          ) : (
            <Field label="Error">
              <Text color="red">{editState.parseResult.error}</Text>
            </Field>
          )}
        </Box>
      )}
    </Box>
  );
}
