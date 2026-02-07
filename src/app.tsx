import React, { useState, useEffect, useCallback } from "react";
import { Box, useInput, useApp } from "ink";
import type { ViewMode, LaunchJob } from "./types.ts";
import { useJobs } from "./hooks/use-jobs.ts";
import { useFilter } from "./hooks/use-filter.ts";
import { useConfig } from "./hooks/use-config.ts";
import { Header } from "./components/header.tsx";
import { Footer } from "./components/footer.tsx";
import { FilterBar } from "./components/filter-bar.tsx";
import { JobList } from "./components/job-list.tsx";
import { JobDetail } from "./components/job-detail.tsx";
import { ScheduleEditor } from "./components/schedule-editor.tsx";
import { SettingsView } from "./components/settings-view.tsx";
import { Loading } from "./components/loading.tsx";
import { LiveTailViewer } from "./components/live-tail-viewer.tsx";
import { useLogTail } from "./hooks/use-log-tail.ts";
import { runService } from "./data/run-service.ts";

export function App() {
  const { jobs, loading, error, refresh } = useJobs();
  const {
    filterState,
    filteredJobs,
    setSearchText,
    toggleAppleServices,
  } = useFilter(jobs);
  const { config, updateConfig } = useConfig();
  const { exit } = useApp();

  const [view, setView] = useState<ViewMode>("list");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [editingJob, setEditingJob] = useState<LaunchJob | null>(null);
  const [runConfirm, setRunConfirm] = useState(false);
  const [runPhase, setRunPhase] = useState<"idle" | "running" | "success" | "error">("idle");
  const [runError, setRunError] = useState<string | undefined>();
  const [tailLogPath, setTailLogPath] = useState<string | null>(null);
  const [tailJobLabel, setTailJobLabel] = useState("");
  const [tailPaused, setTailPaused] = useState(false);

  // Clamp selectedIndex when filteredJobs changes
  useEffect(() => {
    setSelectedIndex((prev) =>
      Math.max(0, Math.min(prev, filteredJobs.length - 1))
    );
  }, [filteredJobs.length]);

  const selectedJob = filteredJobs[selectedIndex];

  const { lines: tailLines, isStreaming: tailStreaming, error: tailError } = useLogTail(tailLogPath, view === "tail");

  // Auto-transition from run success to tail view
  useEffect(() => {
    if (runPhase !== "success" || !selectedJob) return;
    const logPath = selectedJob.logPaths.stdout ?? selectedJob.logPaths.stderr;
    if (!logPath) return;

    const timer = setTimeout(() => {
      setTailLogPath(logPath);
      setTailJobLabel(selectedJob.label);
      setTailPaused(false);
      setRunPhase("idle");
      setRunError(undefined);
      setView("tail");
    }, 1000);

    return () => clearTimeout(timer);
  }, [runPhase, selectedJob]);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
    },
    [setSearchText]
  );

  useInput(
    (input, key) => {
      // Handle run confirm/phase states in detail view
      if (view === "detail") {
        if (runPhase === "success" || runPhase === "error") {
          setRunPhase("idle");
          setRunError(undefined);
          refresh();
          return;
        }

        if (runConfirm) {
          if (input === "y" && selectedJob) {
            setRunConfirm(false);
            setRunPhase("running");
            runService(selectedJob.label)
              .then(() => setRunPhase("success"))
              .catch((err) => {
                setRunError(err instanceof Error ? err.message : String(err));
                setRunPhase("error");
              });
          } else if (input === "n" || key.escape) {
            setRunConfirm(false);
          }
          return;
        }
      }

      // Always handle Escape
      if (key.escape) {
        if (view === "tail") {
          setTailLogPath(null);
          setTailPaused(false);
          setView("detail");
          return;
        }
        if (isSearchFocused) {
          setIsSearchFocused(false);
          return;
        }
        if (view === "detail") {
          setView("list");
          return;
        }
      }

      // Tail view keys
      if (view === "tail") {
        if (input === "p") {
          setTailPaused((prev) => !prev);
          return;
        }
        if (input === "q") {
          exit();
          return;
        }
        return;
      }

      // List navigation works even when search is focused
      if (view === "list") {
        if (key.upArrow) {
          setSelectedIndex((prev) => Math.max(0, prev - 1));
          return;
        }
        if (key.downArrow) {
          setSelectedIndex((prev) =>
            Math.min(filteredJobs.length - 1, prev + 1)
          );
          return;
        }
        if (key.return) {
          if (filteredJobs.length > 0) {
            setIsSearchFocused(false);
            setView("detail");
          }
          return;
        }
      }

      // When search is focused, don't handle other keys
      if (isSearchFocused) {
        return;
      }

      if (input === "q") {
        exit();
        return;
      }

      if (input === "r") {
        refresh();
        return;
      }

      if (input === "/") {
        setIsSearchFocused(true);
        return;
      }

      if (input === "a") {
        toggleAppleServices();
        return;
      }

      if (input === "s" && view === "list") {
        setView("settings");
        return;
      }

      if (view === "detail" && input === "e" && selectedJob?.source === "user") {
        setEditingJob(selectedJob);
        setView("edit");
        return;
      }

      if (view === "detail" && input === "x" && runPhase === "idle") {
        setRunConfirm(true);
        return;
      }

      if (view === "detail" && input === "t" && selectedJob) {
        const logPath = selectedJob.logPaths.stdout ?? selectedJob.logPaths.stderr;
        if (logPath) {
          setTailLogPath(logPath);
          setTailJobLabel(selectedJob.label);
          setTailPaused(false);
          setView("tail");
        }
        return;
      }
    },
    { isActive: view !== "edit" && view !== "settings" },
  );

  if (loading && jobs.length === 0) {
    return <Loading />;
  }

  const runningCount = filteredJobs.filter((j) => j.isRunning).length;
  const errorCount = filteredJobs.filter((j) => j.health === "error").length;

  return (
    <Box flexDirection="column">
      <Header
        jobCount={filteredJobs.length}
        runningCount={runningCount}
        errorCount={errorCount}
      />
      {view === "list" && (
        <>
          <FilterBar
            filterState={filterState}
            onSearchChange={handleSearchChange}
            onToggleApple={toggleAppleServices}
            isSearchFocused={isSearchFocused}
          />
          <JobList jobs={filteredJobs} selectedIndex={selectedIndex} />
        </>
      )}
      {view === "detail" && selectedJob && (
        <JobDetail job={selectedJob} config={config} runConfirm={runConfirm} runPhase={runPhase} runError={runError} />
      )}
      {view === "edit" && editingJob && (
        <ScheduleEditor
          job={editingJob}
          config={config}
          onDone={() => {
            setView("detail");
            setEditingJob(null);
            refresh();
          }}
        />
      )}
      {view === "tail" && tailLogPath && (
        <LiveTailViewer
          jobLabel={tailJobLabel}
          logPath={tailLogPath}
          lines={tailLines}
          isStreaming={tailStreaming}
          error={tailError}
          isPaused={tailPaused}
        />
      )}
      {view === "settings" && config && (
        <SettingsView
          config={config}
          onUpdateConfig={updateConfig}
          onClose={() => setView("list")}
        />
      )}
      <Footer view={view} />
    </Box>
  );
}
