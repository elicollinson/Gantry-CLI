import type { GantryConfig } from "../config/types.ts";
import { callLLM } from "./client.ts";
import { buildLogSummaryPrompt } from "./prompts.ts";

const MAX_LOG_CHARS = 4000;

export async function summarizeLogs(
  config: GantryConfig,
  logContent: string,
  jobLabel: string,
): Promise<string | null> {
  try {
    const truncated = logContent.length > MAX_LOG_CHARS
      ? logContent.slice(-MAX_LOG_CHARS)
      : logContent;

    const { systemPrompt, userMessage } = buildLogSummaryPrompt(truncated, jobLabel);
    const response = await callLLM(config, { systemPrompt, userMessage });
    return response || null;
  } catch {
    return null;
  }
}
