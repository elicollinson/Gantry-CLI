import React from "react";
import { Box, Text, useStdout } from "ink";

export function Header({
  jobCount,
  runningCount,
  errorCount,
}: {
  jobCount: number;
  runningCount: number;
  errorCount: number;
}) {
  const { stdout } = useStdout();
  const width = stdout.columns ?? 80;

  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between">
        <Text bold color="cyan">
          {" \u2693 Gantry "}
        </Text>
        <Box gap={1}>
          <Text dimColor>{jobCount} jobs</Text>
          {runningCount > 0 && (
            <Text color="green">{runningCount} running</Text>
          )}
          {errorCount > 0 && (
            <Text color="red">{errorCount} errored</Text>
          )}
        </Box>
      </Box>
      <Text dimColor>{"\u2500".repeat(width)}</Text>
    </Box>
  );
}
