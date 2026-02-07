import { useState, useEffect, useRef } from "react";
import { spawn, type ChildProcess } from "node:child_process";

const MAX_LINES = 500;

export function useLogTail(logPath: string | null, active: boolean) {
  const [lines, setLines] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const procRef = useRef<ChildProcess | null>(null);

  useEffect(() => {
    if (!logPath || !active) {
      if (procRef.current) {
        procRef.current.kill();
        procRef.current = null;
      }
      setIsStreaming(false);
      return;
    }

    setLines([]);
    setError(null);
    setIsStreaming(true);

    let cancelled = false;

    try {
      const proc = spawn("tail", ["-F", "-n", "50", logPath], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      procRef.current = proc;

      let partial = "";

      proc.stdout?.on("data", (chunk: Buffer) => {
        if (cancelled) return;

        const text = chunk.toString("utf-8");
        partial += text;
        const parts = partial.split("\n");
        partial = parts.pop() ?? "";

        const newLines = parts.filter((l) => l.length > 0);
        if (newLines.length > 0) {
          setLines((prev) => {
            const combined = [...prev, ...newLines];
            return combined.length > MAX_LINES
              ? combined.slice(-MAX_LINES)
              : combined;
          });
        }
      });

      proc.on("error", (err) => {
        if (!cancelled) {
          setError(err.message);
          setIsStreaming(false);
        }
      });

      proc.on("close", () => {
        if (!cancelled) {
          setIsStreaming(false);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsStreaming(false);
    }

    return () => {
      cancelled = true;
      if (procRef.current) {
        procRef.current.kill();
        procRef.current = null;
      }
      setIsStreaming(false);
    };
  }, [logPath, active]);

  return { lines, isStreaming, error };
}
