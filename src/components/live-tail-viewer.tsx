import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useStdout } from "ink";

const RESERVED_LINES = 6; // header + status + path + scroll indicators + footer

export function LiveTailViewer({
  jobLabel,
  logPath,
  lines,
  isStreaming,
  error,
  isPaused,
}: {
  jobLabel: string;
  logPath: string;
  lines: string[];
  isStreaming: boolean;
  error: string | null;
  isPaused: boolean;
}) {
  const { stdout } = useStdout();
  const termHeight = stdout.rows ?? 24;
  const maxVisible = Math.max(3, termHeight - RESERVED_LINES);

  const [scrollOffset, setScrollOffset] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  // When paused, disable auto-scroll; when unpaused, re-enable
  useEffect(() => {
    if (!isPaused) {
      setAutoScroll(true);
    } else {
      setAutoScroll(false);
    }
  }, [isPaused]);

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (autoScroll) {
      setScrollOffset(Math.max(0, lines.length - maxVisible));
    }
  }, [lines.length, autoScroll, maxVisible]);

  useInput((input, key) => {
    if (key.upArrow) {
      setAutoScroll(false);
      setScrollOffset((prev) => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      const maxOffset = Math.max(0, lines.length - maxVisible);
      setScrollOffset((prev) => {
        const next = Math.min(maxOffset, prev + 1);
        if (next >= maxOffset) setAutoScroll(true);
        return next;
      });
    }
  });

  const maxOffset = Math.max(0, lines.length - maxVisible);
  const clampedOffset = Math.min(scrollOffset, maxOffset);
  const visibleLines = lines.slice(clampedOffset, clampedOffset + maxVisible);
  const hasAbove = clampedOffset > 0;
  const hasBelow = clampedOffset + maxVisible < lines.length;

  let statusColor: string;
  let statusText: string;
  if (error) {
    statusColor = "red";
    statusText = "ERROR";
  } else if (isPaused) {
    statusColor = "yellow";
    statusText = "PAUSED";
  } else {
    statusColor = "green";
    statusText = "LIVE";
  }

  return (
    <Box flexDirection="column">
      <Box gap={2}>
        <Text bold>{jobLabel}</Text>
        <Text color={statusColor} bold>
          {statusText}
        </Text>
        <Text dimColor>({lines.length} lines)</Text>
      </Box>
      <Text dimColor>{logPath}</Text>
      {error && <Text color="red">{error}</Text>}
      {hasAbove && (
        <Text dimColor> {"\u25B4"} {clampedOffset} lines above</Text>
      )}
      <Box flexDirection="column">
        {visibleLines.map((line, i) => (
          <Text key={clampedOffset + i} dimColor wrap="truncate">
            {line}
          </Text>
        ))}
      </Box>
      {hasBelow && (
        <Text dimColor>
          {" "}
          {"\u25BE"} {lines.length - clampedOffset - maxVisible} lines below
        </Text>
      )}
    </Box>
  );
}
