import { join } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";
import { createHash } from "crypto";
import { getConfigDir } from "../config/store.ts";

interface CacheEntry {
  summary: string;
  contentHash: string;
}

type CacheData = Record<string, CacheEntry>;

function getCachePath(): string {
  return join(getConfigDir(), "summary-cache.json");
}

function hashContent(content: string): string {
  return createHash("md5").update(content).digest("hex");
}

async function readCache(): Promise<CacheData> {
  try {
    const text = await readFile(getCachePath(), "utf-8");
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function writeCache(data: CacheData): Promise<void> {
  await mkdir(getConfigDir(), { recursive: true });
  await writeFile(getCachePath(), JSON.stringify(data) + "\n");
}

export async function getCachedSummary(jobLabel: string, logContent: string): Promise<string | null> {
  const cache = await readCache();
  const entry = cache[jobLabel];
  if (!entry) return null;
  if (entry.contentHash !== hashContent(logContent)) return null;
  return entry.summary;
}

export async function setCachedSummary(jobLabel: string, logContent: string, summary: string): Promise<void> {
  const cache = await readCache();
  cache[jobLabel] = { summary, contentHash: hashContent(logContent) };
  await writeCache(cache);
}
