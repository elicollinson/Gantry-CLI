import { useState, useEffect, useCallback } from "react";
import type { GantryConfig } from "../config/types.ts";
import { loadConfig, saveConfig } from "../config/store.ts";

export function useConfig(): {
  config: GantryConfig | null;
  updateConfig: (updater: (prev: GantryConfig) => GantryConfig) => void;
} {
  const [config, setConfig] = useState<GantryConfig | null>(null);

  useEffect(() => {
    loadConfig().then(setConfig);
  }, []);

  const updateConfig = useCallback(
    (updater: (prev: GantryConfig) => GantryConfig) => {
      setConfig((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        saveConfig(next);
        return next;
      });
    },
    [],
  );

  return { config, updateConfig };
}
