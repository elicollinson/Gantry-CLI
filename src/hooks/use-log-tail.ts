import { useState, useEffect, useRef } from "react";

const MAX_LINES = 500;

export function useLogTail(logPath: string | null, active: boolean) {
  const [lines, setLines] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const procRef = useRef<ReturnType<typeof Bun.spawn> | null>(null);

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
      const proc = Bun.spawn(["tail", "-F", "-n", "50", logPath], {
        stdout: "pipe",
        stderr: "pipe",
      });
      procRef.current = proc;

      const reader = proc.stdout.getReader();
      const decoder = new TextDecoder();
      let partial = "";

      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done || cancelled) break;

            const text = decoder.decode(value, { stream: true });
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
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : String(err));
            setIsStreaming(false);
          }
        }
      })();

      // Read stderr for errors
      const stderrReader = proc.stderr.getReader();
      (async () => {
        const stderrDecoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await stderrReader.read();
            if (done || cancelled) break;
            const text = stderrDecoder.decode(value, { stream: true });
            // tail -F prints warnings about missing files, ignore those
            if (text.includes("No such file")) continue;
          }
        } catch {
          // ignore stderr read errors
        }
      })();
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
