import React from "react";
import { Box, Text } from "ink";
import { TextInput } from "@inkjs/ui";
import type { FilterState } from "../types.ts";

export function FilterBar({
  filterState,
  onSearchChange,
  onToggleApple,
  isSearchFocused,
}: {
  filterState: FilterState;
  onSearchChange: (text: string) => void;
  onToggleApple: () => void;
  isSearchFocused: boolean;
}) {
  const appleLabel = filterState.showAppleServices
    ? "Apple: shown"
    : "Apple: hidden";

  const healthLabel =
    filterState.healthFilter !== "all"
      ? `Health: ${filterState.healthFilter}`
      : null;

  const sourceLabel =
    filterState.sourceFilter !== "all"
      ? `Source: ${filterState.sourceFilter}`
      : null;

  return (
    <Box>
      <Box marginRight={2}>
        {isSearchFocused ? (
          <Box>
            <Text color="yellow">/ Search: </Text>
            <TextInput
              placeholder="type to filter..."
              onChange={onSearchChange}
              defaultValue={filterState.searchText}
            />
          </Box>
        ) : (
          <Text dimColor>
            / Search{filterState.searchText ? `: ${filterState.searchText}` : ""}
          </Text>
        )}
      </Box>
      <Box>
        <Text dimColor>[{appleLabel}]</Text>
        {healthLabel && (
          <Text dimColor> [{healthLabel}]</Text>
        )}
        {sourceLabel && (
          <Text dimColor> [{sourceLabel}]</Text>
        )}
      </Box>
    </Box>
  );
}
