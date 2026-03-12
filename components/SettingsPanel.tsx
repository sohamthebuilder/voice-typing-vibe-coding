"use client";

import { useState, useEffect } from "react";
import { classNames } from "@/lib/utils";
import { ModelDef, ModelParamDef, getModelParams, PROVIDER_META } from "@/lib/models";

export interface Settings {
  micDeviceId: string;
  punctuate: boolean;
  profanityFilter: boolean;
  modelParams: Record<string, unknown>;
}

interface SettingsPanelProps {
  theme: "dark" | "light";
  settings: Settings;
  onSettingsChange: (s: Settings) => void;
  selectedModel: ModelDef | null;
  isMobileSheet?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

interface AudioDevice {
  deviceId: string;
  label: string;
}

function Toggle({
  checked,
  onChange,
  theme,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  theme: "dark" | "light";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={classNames(
        "relative w-9 h-5 rounded-full transition-colors",
        checked
          ? "bg-blue-500"
          : theme === "dark"
            ? "bg-[#3f3f46]"
            : "bg-[#d4d4d8]"
      )}
    >
      <div
        className={classNames(
          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-4.5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function ParamControl({
  param,
  value,
  onChange,
  theme,
}: {
  param: ModelParamDef;
  value: unknown;
  onChange: (value: unknown) => void;
  theme: "dark" | "light";
}) {
  const dark = theme === "dark";

  if (param.type === "boolean") {
    return (
      <div className="flex items-center justify-between">
        <div className="pr-2">
          <p className={classNames("text-sm font-medium", dark ? "text-white" : "text-[#09090b]")}>
            {param.label}
          </p>
          <p className={classNames("text-xs", dark ? "text-[#71717a]" : "text-[#a1a1aa]")}>
            {param.description}
          </p>
        </div>
        <Toggle checked={!!value} onChange={onChange} theme={theme} />
      </div>
    );
  }

  if (param.type === "number") {
    const numVal = typeof value === "number" ? value : (param.default as number);
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className={classNames("text-sm font-medium", dark ? "text-white" : "text-[#09090b]")}>
            {param.label}
          </p>
          <span className={classNames("text-xs font-mono tabular-nums", dark ? "text-[#a1a1aa]" : "text-[#71717a]")}>
            {numVal}
          </span>
        </div>
        <input
          type="range"
          min={param.min ?? 0}
          max={param.max ?? 100}
          step={param.step ?? 1}
          value={numVal}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={classNames(
            "w-full h-1.5 rounded-full appearance-none cursor-pointer",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-sm",
            dark ? "bg-[#27272a]" : "bg-[#e4e4e7]"
          )}
        />
        <p className={classNames("text-xs mt-1", dark ? "text-[#71717a]" : "text-[#a1a1aa]")}>
          {param.description}
        </p>
      </div>
    );
  }

  if (param.type === "select") {
    const strVal = typeof value === "string" ? value : String(param.default);
    return (
      <div>
        <label className={classNames("block text-sm font-medium mb-1.5", dark ? "text-white" : "text-[#09090b]")}>
          {param.label}
        </label>
        <select
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className={classNames(
            "w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors appearance-none",
            dark
              ? "bg-[#18181b] border border-[#27272a] text-white hover:border-[#3f3f46]"
              : "bg-white border border-[#e4e4e7] text-[#09090b] hover:border-[#d4d4d8]"
          )}
        >
          {param.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <p className={classNames("text-xs mt-1", dark ? "text-[#71717a]" : "text-[#a1a1aa]")}>
          {param.description}
        </p>
      </div>
    );
  }

  // string type
  const strVal = typeof value === "string" ? value : String(param.default ?? "");
  return (
    <div>
      <label className={classNames("block text-sm font-medium mb-1.5", dark ? "text-white" : "text-[#09090b]")}>
        {param.label}
      </label>
      <input
        type="text"
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        placeholder={param.placeholder}
        className={classNames(
          "w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors",
          dark
            ? "bg-[#18181b] border border-[#27272a] text-white hover:border-[#3f3f46] placeholder:text-[#52525b]"
            : "bg-white border border-[#e4e4e7] text-[#09090b] hover:border-[#d4d4d8] placeholder:text-[#a1a1aa]"
        )}
      />
      <p className={classNames("text-xs mt-1", dark ? "text-[#71717a]" : "text-[#a1a1aa]")}>
        {param.description}
      </p>
    </div>
  );
}

export function SettingsPanel({
  theme,
  settings,
  onSettingsChange,
  selectedModel,
  isMobileSheet,
  isOpen,
  onClose,
}: SettingsPanelProps) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);

  useEffect(() => {
    async function loadDevices() {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices
          .filter((d) => d.kind === "audioinput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
          }));
        setDevices(audioInputs);
      } catch {
        // Permission might not be granted yet
      }
    }
    loadDevices();
  }, []);

  const dark = theme === "dark";
  const providerParams = selectedModel ? getModelParams(selectedModel.provider) : [];

  const handleParamChange = (key: string, value: unknown) => {
    onSettingsChange({
      ...settings,
      modelParams: { ...settings.modelParams, [key]: value },
    });
  };

  const content = (
    <div className="space-y-4">
      <div>
        <label className={classNames(
          "block text-xs font-medium mb-1.5",
          dark ? "text-[#a1a1aa]" : "text-[#71717a]"
        )}>
          Microphone
        </label>
        <select
          value={settings.micDeviceId}
          onChange={(e) =>
            onSettingsChange({ ...settings, micDeviceId: e.target.value })
          }
          className={classNames(
            "w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors appearance-none",
            dark
              ? "bg-[#18181b] border border-[#27272a] text-white hover:border-[#3f3f46]"
              : "bg-white border border-[#e4e4e7] text-[#09090b] hover:border-[#d4d4d8]"
          )}
        >
          <option value="">Default</option>
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className={classNames(
            "text-sm font-medium",
            dark ? "text-white" : "text-[#09090b]"
          )}>
            Punctuation
          </p>
          <p className={classNames(
            "text-xs",
            dark ? "text-[#71717a]" : "text-[#a1a1aa]"
          )}>
            Auto-add punctuation (Deepgram, Azure)
          </p>
        </div>
        <Toggle
          checked={settings.punctuate}
          onChange={(v) => onSettingsChange({ ...settings, punctuate: v })}
          theme={theme}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className={classNames(
            "text-sm font-medium",
            dark ? "text-white" : "text-[#09090b]"
          )}>
            Profanity Filter
          </p>
          <p className={classNames(
            "text-xs",
            dark ? "text-[#71717a]" : "text-[#a1a1aa]"
          )}>
            Mask profane words (Deepgram, Azure)
          </p>
        </div>
        <Toggle
          checked={settings.profanityFilter}
          onChange={(v) =>
            onSettingsChange({ ...settings, profanityFilter: v })
          }
          theme={theme}
        />
      </div>

      {providerParams.length > 0 && (
        <>
          <div className={classNames(
            "border-t pt-4",
            dark ? "border-[#27272a]" : "border-[#e4e4e7]"
          )}>
            <p className={classNames(
              "text-xs font-medium mb-3 uppercase tracking-wider",
              dark ? "text-[#52525b]" : "text-[#a1a1aa]"
            )}>
              {PROVIDER_META[selectedModel!.provider].label} Parameters
            </p>
          </div>
          {providerParams.map((param) => (
            <ParamControl
              key={param.key}
              param={param}
              value={settings.modelParams[param.key] ?? param.default}
              onChange={(v) => handleParamChange(param.key, v)}
              theme={theme}
            />
          ))}
        </>
      )}
    </div>
  );

  if (isMobileSheet) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
        )}
        <div
          className={classNames(
            "fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl transition-transform duration-300",
            dark ? "bg-[#18181b]" : "bg-white",
            isOpen ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className={classNames(
              "w-10 h-1 rounded-full",
              dark ? "bg-[#3f3f46]" : "bg-[#d4d4d8]"
            )} />
          </div>
          <div className="p-4 pb-8">{content}</div>
        </div>
      </>
    );
  }

  return (
    <div className="mt-4">
      <h3 className={classNames(
        "text-xs font-medium mb-3 uppercase tracking-wider",
        dark ? "text-[#52525b]" : "text-[#a1a1aa]"
      )}>
        Settings
      </h3>
      {content}
    </div>
  );
}
