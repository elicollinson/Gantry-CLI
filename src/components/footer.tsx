import React from "react";
import { Box, Text } from "ink";
import type { ViewMode } from "../types.ts";

export function Footer({ view }: { view: ViewMode }) {
  const shortcuts =
    view === "list"
      ? "\u2191\u2193 Navigate  Enter Detail  / Search  a Apple  r Refresh  q Quit"
      : "Esc Back  \u2191\u2193 Scroll Log  r Refresh  q Quit";

  return (
    <Box>
      <Text dimColor>{shortcuts}</Text>
    </Box>
  );
}
