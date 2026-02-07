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

  const keyMap: Record<ViewMode, { k: string; label: string }[]> = {
    list: [
      { k: "\u2191\u2193", label: "Navigate" },
      { k: "\u21B5", label: "Detail" },
      { k: "/", label: "Search" },
      { k: "a", label: "Apple" },
      { k: "r", label: "Refresh" },
      { k: "q", label: "Quit" },
    ],
    detail: [
      { k: "esc", label: "Back" },
      { k: "\u2191\u2193", label: "Scroll" },
      { k: "e", label: "Edit" },
      { k: "r", label: "Refresh" },
      { k: "q", label: "Quit" },
    ],
    edit: [
      { k: "esc", label: "Cancel" },
      { k: "tab", label: "Mode" },
      { k: "\u21B5", label: "Confirm" },
    ],
  };
  const keys = keyMap[view];

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
