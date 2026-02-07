import React from "react";
import { Box } from "ink";
import { Spinner } from "@inkjs/ui";

export function Loading() {
  return (
    <Box>
      <Spinner label="Loading launch agents..." />
    </Box>
  );
}
