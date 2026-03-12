"use client";

import { classNames, countWords } from "@/lib/utils";
import { PROVIDER_META, findModel } from "@/lib/models";

interface StatusBarProps {
  theme: "dark" | "light";
  fullText: string;
  modelId: string | null;
  latency: number | null;
}

export function StatusBar({ theme, fullText, modelId, latency }: StatusBarProps) {
  const dark = theme === "dark";
  const model = modelId ? findModel(modelId) : null;
  const wc = countWords(fullText);

  return (
    <div
      className={classNames(
        "flex items-center justify-between px-4 md:px-6 py-2 border-t text-xs",
        dark
          ? "bg-[#09090b] border-[#27272a] text-[#52525b]"
          : "bg-white border-[#e4e4e7] text-[#a1a1aa]"
      )}
    >
      <span>{wc} word{wc !== 1 ? "s" : ""}</span>

      <div className="flex items-center gap-3">
        {model && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: PROVIDER_META[model.provider].color }}
            />
            {model.name} · {PROVIDER_META[model.provider].label}
          </span>
        )}

        {latency !== null && (
          <span className={classNames(
            latency < 500 ? "text-green-500" : latency < 1500 ? "text-amber-500" : "text-red-500"
          )}>
            {latency}ms
          </span>
        )}
      </div>
    </div>
  );
}
