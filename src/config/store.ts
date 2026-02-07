import { homedir } from "os";
import { join } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";
import type { GantryConfig } from "./types.ts";

export function getConfigDir(): string {
  return join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "gantry");
}

export function getConfigPath(): string {
  return join(getConfigDir(), "config.json");
}

function defaultConfig(): GantryConfig {
  return {
    llm: {
      apiKeys: {},
      selectedModel: null,
    },
  };
}

export async function loadConfig(): Promise<GantryConfig> {
  try {
    const text = await readFile(getConfigPath(), "utf-8");
    const parsed = JSON.parse(text);
    const defaults = defaultConfig();
    return {
      llm: {
        apiKeys: { ...defaults.llm.apiKeys, ...parsed?.llm?.apiKeys },
        selectedModel: parsed?.llm?.selectedModel ?? defaults.llm.selectedModel,
      },
    };
  } catch {
    return defaultConfig();
  }
}

export async function saveConfig(config: GantryConfig): Promise<void> {
  await mkdir(getConfigDir(), { recursive: true });
  await writeFile(getConfigPath(), JSON.stringify(config, null, 2) + "\n");
}
