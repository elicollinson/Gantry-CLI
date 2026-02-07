import { useState, useEffect } from "react";
import type { PrintInfo } from "../types.ts";
import { getPrintInfo } from "../data/print-parser.ts";
import { readLogTail } from "../data/log-reader.ts";

export function useJobDetail(label: string | null): {
  printInfo: PrintInfo | null;
  logContent: string | null;
  loading: boolean;
} {
  const [printInfo, setPrintInfo] = useState<PrintInfo | null>(null);
  const [logContent, setLogContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!label) {
      setPrintInfo(null);
      setLogContent(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function fetchDetail() {
      try {
        const info = await getPrintInfo(label!);
        if (cancelled) return;
        setPrintInfo(info);

        // Try to read log content from stdout or stderr path
        const logPath = info?.stdoutPath ?? info?.stderrPath;
        if (logPath) {
          const content = await readLogTail(logPath, 100);
          if (!cancelled) {
            setLogContent(content);
          }
        } else {
          if (!cancelled) {
            setLogContent(null);
          }
        }
      } catch {
        if (!cancelled) {
          setPrintInfo(null);
          setLogContent(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [label]);

  return { printInfo, logContent, loading };
}
