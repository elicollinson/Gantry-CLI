import React from "react";
import { Box, Text } from "ink";

export function Header({
  jobCount,
  runningCount,
  errorCount,
}: {
  jobCount: number;
  runningCount: number;
  errorCount: number;
}) {
  const parts: string[] = [];
  if (runningCount > 0) parts.push(`${runningCount} running`);
  if (errorCount > 0) parts.push(`${errorCount} error`);
  const stats =
    parts.length > 0
      ? `${jobCount} jobs (${parts.join(", ")})`
      : `${jobCount} jobs`;

  return (
    <Box justifyContent="space-between">
      <Text bold> Gantry</Text>
      <Text dimColor>{stats}</Text>
    </Box>
  );
}
