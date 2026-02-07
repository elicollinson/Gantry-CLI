import { useState, useCallback } from "react";
import type {
  LaunchJob,
  EditInputMode,
  EditPhase,
  EditState,
  ScheduleParseResult,
} from "../types.ts";
import { parseNaturalSchedule } from "../schedule/parse-natural.ts";
import { parseCronSchedule } from "../schedule/parse-cron.ts";
import { backupPlist, writeScheduleToPlist } from "../data/plist-writer.ts";
import { reloadService } from "../data/service-reload.ts";

export interface UseEditScheduleReturn {
  editState: EditState;
  setInputText: (text: string) => void;
  toggleInputMode: () => void;
  confirm: () => void;
  apply: () => Promise<void>;
  cancel: () => void;
}

export function useEditSchedule(job: LaunchJob): UseEditScheduleReturn {
  const [phase, setPhase] = useState<EditPhase>("input");
  const [inputMode, setInputMode] = useState<EditInputMode>("cron");
  const [inputText, setInputTextRaw] = useState("");
  const [parseResult, setParseResult] = useState<ScheduleParseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

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
      if (!text.trim()) {
        setParseResult(null);
        return;
      }
      const result =
        inputMode === "natural"
          ? parseNaturalSchedule(text)
          : parseCronSchedule(text);
      setParseResult(result);
    },
    [inputMode],
  );

  const toggleInputMode = useCallback(() => {
    setInputMode((prev) => (prev === "natural" ? "cron" : "natural"));
    setInputTextRaw("");
    setParseResult(null);
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
    setPhase("input");
    setInputTextRaw("");
    setParseResult(null);
    setErrorMessage(undefined);
  }, []);

  return { editState, setInputText, toggleInputMode, confirm, apply, cancel };
}
