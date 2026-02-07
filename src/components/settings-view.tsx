import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import type { GantryConfig, LLMProvider } from "../config/types.ts";
import { AVAILABLE_MODELS } from "../config/models.ts";

type Section = "keys" | "models";

const PROVIDERS: { id: LLMProvider; label: string }[] = [
  { id: "anthropic", label: "Anthropic" },
  { id: "google", label: "Google" },
  { id: "openai", label: "OpenAI" },
];

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "..." + key.slice(-4);
}

export function SettingsView({
  config,
  onUpdateConfig,
  onClose,
}: {
  config: GantryConfig;
  onUpdateConfig: (updater: (prev: GantryConfig) => GantryConfig) => void;
  onClose: () => void;
}) {
  const [section, setSection] = useState<Section>("keys");
  const [keyIndex, setKeyIndex] = useState(0);
  const [modelIndex, setModelIndex] = useState(0);
  const [editingKey, setEditingKey] = useState(false);

  const maxKeyIndex = PROVIDERS.length - 1;
  const maxModelIndex = AVAILABLE_MODELS.length - 1;

  const handleKeySubmit = useCallback(
    (value: string) => {
      const provider = PROVIDERS[keyIndex]!.id;
      const trimmed = value.trim();
      onUpdateConfig((prev) => ({
        ...prev,
        llm: {
          ...prev.llm,
          apiKeys: {
            ...prev.llm.apiKeys,
            ...(trimmed ? { [provider]: trimmed } : { [provider]: undefined }),
          },
        },
      }));
      setEditingKey(false);
    },
    [keyIndex, onUpdateConfig],
  );

  useInput(
    (input, key) => {
      if (editingKey) {
        if (key.escape) {
          setEditingKey(false);
        }
        return;
      }

      if (key.escape) {
        onClose();
        return;
      }

      if (key.tab) {
        setSection((prev) => (prev === "keys" ? "models" : "keys"));
        return;
      }

      if (key.upArrow) {
        if (section === "keys") {
          setKeyIndex((prev) => Math.max(0, prev - 1));
        } else {
          setModelIndex((prev) => Math.max(0, prev - 1));
        }
        return;
      }

      if (key.downArrow) {
        if (section === "keys") {
          setKeyIndex((prev) => Math.min(maxKeyIndex, prev + 1));
        } else {
          setModelIndex((prev) => Math.min(maxModelIndex, prev + 1));
        }
        return;
      }

      if (key.return) {
        if (section === "keys") {
          setEditingKey(true);
        } else {
          const model = AVAILABLE_MODELS[modelIndex]!;
          const hasKey = Boolean(config.llm.apiKeys[model.provider]);
          if (hasKey) {
            onUpdateConfig((prev) => ({
              ...prev,
              llm: { ...prev.llm, selectedModel: model.id },
            }));
          }
        }
        return;
      }

      // 'd' to delete key when in keys section
      if (input === "d" && section === "keys") {
        const provider = PROVIDERS[keyIndex]!.id;
        onUpdateConfig((prev) => {
          const newKeys = { ...prev.llm.apiKeys };
          delete newKeys[provider];
          // If the selected model uses this provider, deselect it
          const selectedModel = AVAILABLE_MODELS.find((m) => m.id === prev.llm.selectedModel);
          const newSelectedModel =
            selectedModel?.provider === provider ? null : prev.llm.selectedModel;
          return {
            ...prev,
            llm: { ...prev.llm, apiKeys: newKeys, selectedModel: newSelectedModel },
          };
        });
        return;
      }
    },
  );

  return (
    <Box flexDirection="column" paddingLeft={1} paddingRight={1}>
      <Text bold color="cyan">{"\u2500\u2500 Settings \u2500\u2500"}</Text>

      {/* API Keys Section */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color={section === "keys" ? "yellow" : undefined}>
          API Keys {section === "keys" ? "\u25C0" : ""}
        </Text>
        {PROVIDERS.map((provider, i) => {
          const key = config.llm.apiKeys[provider.id];
          const isSelected = section === "keys" && keyIndex === i;
          return (
            <Box key={provider.id}>
              <Text color={isSelected ? "cyan" : undefined}>
                {isSelected ? "\u25B6 " : "  "}
              </Text>
              <Box width={12}>
                <Text bold={isSelected}>{provider.label}</Text>
              </Box>
              {editingKey && isSelected ? (
                <TextInput
                  placeholder="Paste API key..."
                  onSubmit={handleKeySubmit}
                />
              ) : (
                <Text color={key ? "green" : "gray"}>
                  {key ? maskKey(key) : "Not configured"}
                </Text>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Model Selection Section */}
      <Box marginTop={1} flexDirection="column">
        <Text bold color={section === "models" ? "yellow" : undefined}>
          Model {section === "models" ? "\u25C0" : ""}
        </Text>
        {AVAILABLE_MODELS.map((model, i) => {
          const hasKey = Boolean(config.llm.apiKeys[model.provider]);
          const isActive = config.llm.selectedModel === model.id;
          const isSelected = section === "models" && modelIndex === i;
          return (
            <Box key={model.id}>
              <Text color={isSelected ? "cyan" : undefined}>
                {isSelected ? "\u25B6 " : "  "}
              </Text>
              <Text
                dimColor={!hasKey}
                bold={isSelected}
                color={isActive ? "green" : undefined}
              >
                {isActive ? "\u2714 " : "  "}
                {model.label}
              </Text>
              {!hasKey && <Text dimColor> (no key)</Text>}
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          tab: switch section | ↵: {section === "keys" ? "edit key" : "select model"} | d: delete key | esc: back
        </Text>
      </Box>
    </Box>
  );
}
