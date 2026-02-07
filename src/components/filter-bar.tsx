import React from "react";
import { Box, Text } from "ink";
import { TextInput } from "@inkjs/ui";
import type { FilterState } from "../types.ts";

function Badge({ label, active }: { label: string; active: boolean }) {
  return active ? (
    <Text color="black" backgroundColor="yellow"> {label} </Text>
  ) : (
    <Text dimColor> {label} </Text>
  );
}

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
  const hasSearch = filterState.searchText.length > 0;

  return (
    <Box marginBottom={0} gap={1}>
      <Box>
        {isSearchFocused ? (
          <Box>
            <Text color="yellow" bold>{"\u{1F50D}"} </Text>
            <TextInput
              placeholder="type to filter..."
              onChange={onSearchChange}
              defaultValue={filterState.searchText}
            />
          </Box>
        ) : hasSearch ? (
          <Text>
            <Text dimColor>/</Text>
            <Text color="yellow"> {filterState.searchText}</Text>
          </Text>
        ) : (
          <Text dimColor>/ search</Text>
        )}
      </Box>
      <Box gap={0}>
        <Badge
          label={filterState.showAppleServices ? "apple: on" : "apple: off"}
          active={filterState.showAppleServices}
        />
        {filterState.healthFilter !== "all" && (
          <Badge label={`health: ${filterState.healthFilter}`} active />
        )}
        {filterState.sourceFilter !== "all" && (
          <Badge label={`source: ${filterState.sourceFilter}`} active />
        )}
      </Box>
    </Box>
  );
}
