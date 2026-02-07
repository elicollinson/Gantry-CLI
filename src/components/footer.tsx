import React from "react";
import { Box, Text, useStdout } from "ink";
import type { ViewMode } from "../types.ts";

function Key({ k, label }: { k: string; label: string }) {
  return (
    <Box marginRight={1}>
      <Text color="cyan" bold>{k}</Text>
      <Text dimColor> {label}</Text>
    </Box>
  );
}

export function Footer({ view }: { view: ViewMode }) {
  const { stdout } = useStdout();
  const width = stdout.columns ?? 80;

  const keys =
    view === "list"
      ? [
          { k: "\u2191\u2193", label: "Navigate" },
          { k: "\u21B5", label: "Detail" },
          { k: "/", label: "Search" },
          { k: "a", label: "Apple" },
          { k: "r", label: "Refresh" },
          { k: "q", label: "Quit" },
        ]
      : [
          { k: "esc", label: "Back" },
          { k: "\u2191\u2193", label: "Scroll" },
          { k: "r", label: "Refresh" },
          { k: "q", label: "Quit" },
        ];

  return (
    <Box flexDirection="column">
      <Text dimColor>{"\u2500".repeat(width)}</Text>
      <Box gap={1}>
        {keys.map(({ k, label }) => (
          <Key key={k} k={k} label={label} />
        ))}
      </Box>
    </Box>
  );
}
