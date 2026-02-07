import { useState, useEffect } from "react";
import type { GantryConfig } from "../config/types.ts";
import { summarizeLogs } from "../llm/summarize-log.ts";
import { getCachedSummary, setCachedSummary } from "../llm/summary-cache.ts";

export function useLogSummary(
  jobLabel: string | null,
  logContent: string | null,
  config: GantryConfig | null,
): { summary: string | null; loading: boolean } {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobLabel || !logContent || !config?.llm.selectedModel) {
      setSummary(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      // Check disk cache first
      const cached = await getCachedSummary(jobLabel, logContent);
      if (cancelled) return;

      if (cached) {
        setSummary(cached);
        setLoading(false);
        return;
      }

      // Cache miss or stale — call LLM
      const result = await summarizeLogs(config, logContent, jobLabel);
      if (cancelled) return;

      if (result) {
        setSummary(result);
        await setCachedSummary(jobLabel, logContent, result);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [jobLabel, logContent, config?.llm.selectedModel]);

  return { summary, loading };
}
