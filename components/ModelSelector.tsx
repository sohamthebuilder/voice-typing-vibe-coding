"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { getModelsForLanguage, PROVIDER_META, ModelDef } from "@/lib/models";
import { Provider } from "@/lib/providers/types";
import { classNames } from "@/lib/utils";

interface ModelSelectorProps {
  theme: "dark" | "light";
  selectedModelId: string | null;
  selectedLanguage: string | null;
  onSelect: (model: ModelDef) => void;
  disabled?: boolean;
}

const PROVIDER_ORDER: Provider[] = ["openai", "deepgram", "azure", "aws-transcribe", "assemblyai", "elevenlabs", "sarvam"];

export function ModelSelector({
  theme,
  selectedModelId,
  selectedLanguage,
  onSelect,
  disabled,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const compatibleModels = useMemo(
    () => getModelsForLanguage(selectedLanguage),
    [selectedLanguage]
  );

  const grouped = useMemo(() => {
    const g: Record<Provider, ModelDef[]> = {
      openai: [],
      deepgram: [],
      azure: [],
      "aws-transcribe": [],
      assemblyai: [],
      elevenlabs: [],
      sarvam: [],
    };
    for (const m of compatibleModels) {
      g[m.provider].push(m);
    }
    return g;
  }, [compatibleModels]);

  const selected = selectedModelId
    ? compatibleModels.find((m) => m.id === selectedModelId)
    : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dark = theme === "dark";
  const noLanguage = !selectedLanguage;
  const isDisabled = disabled || noLanguage;

  return (
    <div ref={ref} className="relative">
      <label
        className={classNames(
          "block text-xs font-medium mb-1.5",
          dark ? "text-[#a1a1aa]" : "text-[#71717a]"
        )}
      >
        Model
        {selectedLanguage && selectedLanguage !== "auto" && (
          <span className={dark ? "text-[#52525b]" : "text-[#a1a1aa]"}>
            {" "}
            ({compatibleModels.length} available)
          </span>
        )}
      </label>
      <button
        onClick={() => !isDisabled && setIsOpen((o) => !o)}
        disabled={isDisabled}
        className={classNames(
          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
          dark
            ? "bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46]"
            : "bg-white border border-[#e4e4e7] hover:border-[#d4d4d8]",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            <span className={dark ? "text-white" : "text-[#09090b]"}>
              {selected.name}
            </span>
            <span
              className={classNames(
                "text-xs px-1.5 py-0.5 rounded-full shrink-0",
                PROVIDER_META[selected.provider].bgClass,
                PROVIDER_META[selected.provider].textClass
              )}
            >
              {PROVIDER_META[selected.provider].label}
            </span>
            {!selected.isStreaming && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 shrink-0">
                Near real-time
              </span>
            )}
          </span>
        ) : (
          <span className={dark ? "text-[#52525b]" : "text-[#a1a1aa]"}>
            {noLanguage ? "Select a language first" : "Select a model..."}
          </span>
        )}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0 ml-2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={classNames(
            "absolute z-40 w-full mt-1 rounded-lg border shadow-xl max-h-80 overflow-y-auto animate-fade-in",
            dark
              ? "bg-[#18181b] border-[#27272a]"
              : "bg-white border-[#e4e4e7]"
          )}
        >
          {PROVIDER_ORDER.map((provider) => {
            const models = grouped[provider];
            if (models.length === 0) return null;
            const meta = PROVIDER_META[provider];

            return (
              <div key={provider}>
                <div
                  className={classNames(
                    "px-3 py-2 text-xs font-medium sticky top-0",
                    dark
                      ? "bg-[#18181b] text-[#71717a]"
                      : "bg-white text-[#a1a1aa]"
                  )}
                >
                  {meta.label}
                </div>
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelect(m);
                      setIsOpen(false);
                    }}
                    className={classNames(
                      "w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors",
                      dark
                        ? "hover:bg-[#27272a] text-white"
                        : "hover:bg-[#f4f4f5] text-[#09090b]",
                      selectedModelId === m.id &&
                        (dark ? "bg-[#27272a]" : "bg-[#f4f4f5]")
                    )}
                  >
                    <span className="flex-1">{m.name}</span>
                    <span
                      className={classNames(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        meta.bgClass,
                        meta.textClass
                      )}
                    >
                      {meta.label}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
          {compatibleModels.length === 0 && (
            <div
              className={classNames(
                "px-3 py-4 text-sm text-center",
                dark ? "text-[#52525b]" : "text-[#a1a1aa]"
              )}
            >
              No models support this language
            </div>
          )}
        </div>
      )}
    </div>
  );
}
