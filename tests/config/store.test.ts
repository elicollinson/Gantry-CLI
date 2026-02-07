import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { join } from "path";
import { tmpdir } from "os";
import { mkdtemp, rm, writeFile, readFile } from "fs/promises";
import type { GantryConfig } from "../../src/config/types.ts";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "gantry-config-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true });
});

function configPath() {
  return join(tempDir, "config.json");
}

async function loadFromPath(path: string): Promise<GantryConfig> {
  const defaults: GantryConfig = {
    llm: { apiKeys: {}, selectedModel: null },
  };
  try {
    const text = await readFile(path, "utf-8");
    const parsed = JSON.parse(text);
    return {
      llm: {
        apiKeys: { ...defaults.llm.apiKeys, ...parsed?.llm?.apiKeys },
        selectedModel: parsed?.llm?.selectedModel ?? defaults.llm.selectedModel,
      },
    };
  } catch {
    return defaults;
  }
}

async function saveToPath(path: string, config: GantryConfig): Promise<void> {
  await writeFile(path, JSON.stringify(config, null, 2) + "\n");
}

describe("config store", () => {
  test("returns defaults when file is missing", async () => {
    const config = await loadFromPath(configPath());
    expect(config).toEqual({
      llm: { apiKeys: {}, selectedModel: null },
    });
  });

  test("round-trip save and load", async () => {
    const config: GantryConfig = {
      llm: {
        apiKeys: { anthropic: "sk-ant-test123" },
        selectedModel: "claude-haiku-4-5-20251001",
      },
    };
    await saveToPath(configPath(), config);
    const loaded = await loadFromPath(configPath());
    expect(loaded).toEqual(config);
  });

  test("returns defaults for corrupt file", async () => {
    await writeFile(configPath(), "not json at all{{{");
    const config = await loadFromPath(configPath());
    expect(config).toEqual({
      llm: { apiKeys: {}, selectedModel: null },
    });
  });

  test("merges missing fields with defaults", async () => {
    await writeFile(configPath(), JSON.stringify({ llm: { apiKeys: { openai: "sk-test" } } }));
    const config = await loadFromPath(configPath());
    expect(config.llm.selectedModel).toBeNull();
    expect(config.llm.apiKeys.openai).toBe("sk-test");
  });

  test("handles empty object gracefully", async () => {
    await writeFile(configPath(), "{}");
    const config = await loadFromPath(configPath());
    expect(config).toEqual({
      llm: { apiKeys: {}, selectedModel: null },
    });
  });
});
