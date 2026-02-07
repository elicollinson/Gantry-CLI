import React, { useState, useMemo } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { Spinner } from "@inkjs/ui";

const LOG_RESERVED_LINES = 4; // path line + line count indicator + padding

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

  // Allow roughly half the terminal for log display
  const maxLogLines = Math.max(5, Math.floor(termHeight / 2) - LOG_RESERVED_LINES);

  const lines = useMemo(() => {
    if (!content) return [];
    return content.split("\n");
  }, [content]);

  const [scrollOffset, setScrollOffset] = useState(0);

  // Clamp the scroll offset to valid range
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

  if (!content) {
    return (
      <Box paddingLeft={1}>
        <Text dimColor>No log output</Text>
      </Box>
    );
  }

  const visibleLines = lines.slice(clampedOffset, clampedOffset + maxLogLines);

  return (
    <Box flexDirection="column" paddingLeft={1}>
      {path && <Text dimColor>{path}</Text>}
      <Text dimColor>
        (showing {Math.min(maxLogLines, lines.length)} of {lines.length} lines)
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {visibleLines.map((line, i) => (
          <Text key={clampedOffset + i} dimColor>
            {line}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
