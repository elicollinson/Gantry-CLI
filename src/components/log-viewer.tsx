import React, { useState, useMemo } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { Spinner } from "@inkjs/ui";

const LOG_RESERVED_LINES = 14; // header + status + program + schedule + section headers + footer

export function LogViewer({
  content,
  path,
  loading,
}: {
  content: string | null;
  path: string | undefined;
  loading: boolean;
}) {
  const { stdout } = useStdout();
  const termHeight = stdout.rows ?? 24;

  const maxLogLines = Math.max(3, termHeight - LOG_RESERVED_LINES);

  const lines = useMemo(() => {
    if (!content) return [];
    return content.split("\n").filter((l) => l.length > 0);
  }, [content]);

  const [scrollOffset, setScrollOffset] = useState(() =>
    Math.max(0, lines.length - maxLogLines)
  );

  const maxOffset = Math.max(0, lines.length - maxLogLines);
  const clampedOffset = Math.min(scrollOffset, maxOffset);

  useInput((input, key) => {
    if (key.upArrow) {
      setScrollOffset((prev) => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setScrollOffset((prev) => Math.min(maxOffset, prev + 1));
    }
  });

  if (loading) {
    return (
      <Box paddingLeft={1}>
        <Spinner label="Loading logs..." />
      </Box>
    );
  }

  if (!content || lines.length === 0) {
    return (
      <Box paddingLeft={1}>
        <Text dimColor italic>No log output</Text>
      </Box>
    );
  }

  const visibleLines = lines.slice(clampedOffset, clampedOffset + maxLogLines);
  const hasAbove = clampedOffset > 0;
  const hasBelow = clampedOffset + maxLogLines < lines.length;

  return (
    <Box flexDirection="column">
      <Box gap={2}>
        {path && <Text dimColor>{path}</Text>}
        <Text dimColor>
          ({lines.length} lines)
        </Text>
      </Box>
      {hasAbove && (
        <Text dimColor>{" \u25B4 "}{clampedOffset} lines above</Text>
      )}
      <Box flexDirection="column">
        {visibleLines.map((line, i) => (
          <Text key={clampedOffset + i} dimColor wrap="truncate">
            {line}
          </Text>
        ))}
      </Box>
      {hasBelow && (
        <Text dimColor>{" \u25BE "}{lines.length - clampedOffset - maxLogLines} lines below</Text>
      )}
    </Box>
  );
}
