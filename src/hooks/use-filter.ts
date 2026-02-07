import { useState, useMemo, useCallback } from "react";
import type {
  LaunchJob,
  FilterState,
  JobHealth,
  SortField,
  SortDirection,
} from "../types.ts";

const INITIAL_STATE: FilterState = {
  searchText: "",
  healthFilter: "all",
  sourceFilter: "all",
  showAppleServices: false,
  sortField: "label",
  sortDirection: "asc",
};

export function useFilter(jobs: LaunchJob[]): {
  filterState: FilterState;
  filteredJobs: LaunchJob[];
  setSearchText: (text: string) => void;
  toggleHealthFilter: (health: JobHealth | "all") => void;
  toggleSourceFilter: (source: LaunchJob["source"] | "all") => void;
  toggleAppleServices: () => void;
  setSortField: (field: SortField) => void;
} {
  const [filterState, setFilterState] = useState<FilterState>(INITIAL_STATE);

  const setSearchText = useCallback((text: string) => {
    setFilterState((prev) => ({ ...prev, searchText: text }));
  }, []);

  const toggleHealthFilter = useCallback((health: JobHealth | "all") => {
    setFilterState((prev) => ({ ...prev, healthFilter: health }));
  }, []);

  const toggleSourceFilter = useCallback(
    (source: LaunchJob["source"] | "all") => {
      setFilterState((prev) => ({ ...prev, sourceFilter: source }));
    },
    []
  );

  const toggleAppleServices = useCallback(() => {
    setFilterState((prev) => ({
      ...prev,
      showAppleServices: !prev.showAppleServices,
    }));
  }, []);

  const setSortField = useCallback((field: SortField) => {
    setFilterState((prev) => {
      const newDirection: SortDirection =
        prev.sortField === field
          ? prev.sortDirection === "asc"
            ? "desc"
            : "asc"
          : "asc";
      return { ...prev, sortField: field, sortDirection: newDirection };
    });
  }, []);

  const filteredJobs = useMemo(() => {
    let result = jobs;

    // Filter out Apple services unless explicitly shown
    if (!filterState.showAppleServices) {
      result = result.filter((job) => !job.label.startsWith("com.apple."));
    }

    // Search text filter
    if (filterState.searchText) {
      const search = filterState.searchText.toLowerCase();
      result = result.filter(
        (job) =>
          job.label.toLowerCase().includes(search) ||
          job.programFull.toLowerCase().includes(search)
      );
    }

    // Health filter
    if (filterState.healthFilter !== "all") {
      result = result.filter(
        (job) => job.health === filterState.healthFilter
      );
    }

    // Source filter
    if (filterState.sourceFilter !== "all") {
      result = result.filter(
        (job) => job.source === filterState.sourceFilter
      );
    }

    // Sort
    const direction = filterState.sortDirection === "asc" ? 1 : -1;
    result = [...result].sort((a, b) => {
      switch (filterState.sortField) {
        case "label":
          return direction * a.label.localeCompare(b.label);
        case "health": {
          const healthOrder: Record<JobHealth, number> = {
            error: 0,
            warning: 1,
            healthy: 2,
            unknown: 3,
          };
          return direction * (healthOrder[a.health] - healthOrder[b.health]);
        }
        case "source":
          return direction * a.source.localeCompare(b.source);
        case "nextRun": {
          const aTime = a.schedule.nextRun?.getTime() ?? Infinity;
          const bTime = b.schedule.nextRun?.getTime() ?? Infinity;
          return direction * (aTime - bTime);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [jobs, filterState]);

  return {
    filterState,
    filteredJobs,
    setSearchText,
    toggleHealthFilter,
    toggleSourceFilter,
    toggleAppleServices,
    setSortField,
  };
}
