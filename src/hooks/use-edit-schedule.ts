import { useState, useCallback, useRef } from "react";
import type {
  LaunchJob,
  EditInputMode,
  EditPhase,
  EditState,
  ScheduleParseResult,
} from "../types.ts";
import type { GantryConfig } from "../config/types.ts";
import { parseNaturalSchedule } from "../schedule/parse-natural.ts";
import { parseCronSchedule } from "../schedule/parse-cron.ts";
import { parseLLMSchedule } from "../llm/parse-schedule.ts";
import { backupPlist, writeScheduleToPlist } from "../data/plist-writer.ts";
import { reloadService } from "../data/service-reload.ts";
import { AVAILABLE_MODELS } from "../config/models.ts";

export interface UseEditScheduleReturn {
  editState: EditState;
  llmLoading: boolean;
  setInputText: (text: string) => void;
  toggleInputMode: () => void;
  confirm: () => void;
  apply: () => Promise<void>;
  cancel: () => void;
}

function isLLMConfigured(config: GantryConfig | null): boolean {
  if (!config?.llm.selectedModel) return false;
  const model = AVAILABLE_MODELS.find((m) => m.id === config.llm.selectedModel);
  if (!model) return false;
  return Boolean(config.llm.apiKeys[model.provider]);
}

export function useEditSchedule(
  job: LaunchJob,
  config: GantryConfig | null,
): UseEditScheduleReturn {
  const [phase, setPhase] = useState<EditPhase>("input");
  const [inputMode, setInputMode] = useState<EditInputMode>("cron");
  const [inputText, setInputTextRaw] = useState("");
  const [parseResult, setParseResult] = useState<ScheduleParseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [llmLoading, setLlmLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const editState: EditState = {
    phase,
    inputMode,
    inputText,
    parseResult,
    errorMessage,
  };

  const setInputText = useCallback(
    (text: string) => {
      setInputTextRaw(text);

      // Cancel any pending LLM request
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();

      if (!text.trim()) {
        setParseResult(null);
        setLlmLoading(false);
        return;
      }

      // Always run the local parser immediately
      const result =
        inputMode === "natural"
          ? parseNaturalSchedule(text)
          : parseCronSchedule(text);
      setParseResult(result);

      // If natural mode + LLM configured, debounce an LLM call
      if (inputMode === "natural" && isLLMConfigured(config)) {
        setLlmLoading(true);
        debounceRef.current = setTimeout(() => {
          const controller = new AbortController();
          abortRef.current = controller;
          parseLLMSchedule(config!, text, controller.signal)
            .then((llmResult) => {
              if (!controller.signal.aborted && llmResult.ok) {
                setParseResult(llmResult);
              }
            })
            .finally(() => {
              if (!controller.signal.aborted) {
                setLlmLoading(false);
              }
            });
        }, 500);
      }
    },
    [inputMode, config],
  );

  const toggleInputMode = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    setInputMode((prev) => (prev === "natural" ? "cron" : "natural"));
    setInputTextRaw("");
    setParseResult(null);
    setLlmLoading(false);
  }, []);

  const confirm = useCallback(() => {
    if (parseResult?.ok) {
      setPhase("confirm");
    }
  }, [parseResult]);

  const apply = useCallback(async () => {
    if (!parseResult?.ok || !parseResult.schedule) return;

    setPhase("applying");
    setErrorMessage(undefined);

    try {
      await backupPlist(job.plistPath);
      await writeScheduleToPlist(job.plistPath, parseResult.schedule);
      await reloadService(job.label, job.plistPath);
      setPhase("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : String(err),
      );
      setPhase("error");
    }
  }, [parseResult, job.plistPath, job.label]);

  const cancel = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();
    setPhase("input");
    setInputTextRaw("");
    setParseResult(null);
    setErrorMessage(undefined);
    setLlmLoading(false);
  }, []);

  return { editState, llmLoading, setInputText, toggleInputMode, confirm, apply, cancel };
}
