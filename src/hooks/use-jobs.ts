import { useState, useEffect, useCallback } from "react";
import type { LaunchJob } from "../types.ts";
import { collectJobs } from "../data/collector.ts";
import { REFRESH_INTERVAL_MS } from "../constants.ts";

export function useJobs(): {
  jobs: LaunchJob[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
} {
  const [jobs, setJobs] = useState<LaunchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(() => {
    let cancelled = false;

    setLoading(true);
    collectJobs()
      .then((result) => {
        if (!cancelled) {
          setJobs(result);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Initial load
  useEffect(() => {
    const cancel = refresh();
    return cancel;
  }, [refresh]);

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return { jobs, loading, error, refresh };
}
