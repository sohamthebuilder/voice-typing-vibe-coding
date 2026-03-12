"use client";

import { useState, useCallback } from "react";
import { Provider } from "@/lib/providers/types";
import { PROVIDER_META } from "@/lib/models";
import { classNames } from "@/lib/utils";

export interface ApiKeys {
  openai: string;
  deepgram: string;
  azure: string;
  azureRegion: string;
  "aws-transcribe": string;
  awsTranscribeSecret: string;
  awsTranscribeRegion: string;
  assemblyai: string;
  elevenlabs: string;
  sarvam: string;
}

interface KeyValidation {
  status: "idle" | "validating" | "valid" | "invalid";
  error?: string;
}

interface ApiKeyPanelProps {
  theme: "dark" | "light";
  keys: ApiKeys;
  onKeysChange: (keys: ApiKeys) => void;
  highlightProvider?: Provider | null;
  variant?: "topbar" | "sidebar";
  defaultOpen?: boolean;
}

const PROVIDERS_ORDER: Provider[] = ["openai", "deepgram", "azure", "aws-transcribe", "assemblyai", "elevenlabs", "sarvam"];

export function ApiKeyPanel({
  theme,
  keys,
  onKeysChange,
  highlightProvider,
  variant = "topbar",
  defaultOpen = false,
}: ApiKeyPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen || !!highlightProvider);
  const [validations, setValidations] = useState<Record<Provider, KeyValidation>>({
    openai: { status: "idle" },
    deepgram: { status: "idle" },
    azure: { status: "idle" },
    "aws-transcribe": { status: "idle" },
    assemblyai: { status: "idle" },
    elevenlabs: { status: "idle" },
    sarvam: { status: "idle" },
  });

  const validateKey = useCallback(
    async (provider: Provider) => {
      const key = keys[provider];
      if (!key) return;

      setValidations((v) => ({ ...v, [provider]: { status: "validating" } }));

      try {
        const res = await fetch("/api/validate-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider,
            apiKey: key,
            region: provider === "azure" ? keys.azureRegion
              : provider === "aws-transcribe" ? keys.awsTranscribeRegion
              : undefined,
            secretKey: provider === "aws-transcribe" ? keys.awsTranscribeSecret : undefined,
          }),
        });
        const data = await res.json();
        setValidations((v) => ({
          ...v,
          [provider]: {
            status: data.valid ? "valid" : "invalid",
            error: data.error,
          },
        }));
      } catch {
        setValidations((v) => ({
          ...v,
          [provider]: { status: "invalid", error: "Validation request failed" },
        }));
      }
    },
    [keys]
  );

  const dark = theme === "dark";
  const isSidebar = variant === "sidebar";
  const isExpanded = isOpen || !!highlightProvider;

  return (
    <div
      className={classNames(
        "transition-colors",
        isSidebar
          ? classNames(
              "rounded-lg border text-sm",
              dark ? "border-[#27272a] bg-[#18181b]" : "border-[#e4e4e7] bg-white"
            )
          : classNames(
              "border-b",
              dark ? "border-[#27272a]" : "border-[#e4e4e7]"
            )
      )}
    >
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={classNames(
          "w-full flex items-center justify-between font-medium transition-colors",
          isSidebar ? "px-3 py-2 rounded-lg text-xs" : "px-4 md:px-6 py-3 text-sm",
          dark
            ? isSidebar
              ? "text-[#a1a1aa] hover:text-white hover:bg-[#27272a]"
              : "text-[#a1a1aa] hover:text-white hover:bg-[#18181b]"
            : isSidebar
              ? "text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5]"
              : "text-[#71717a] hover:text-[#09090b] hover:bg-[#f4f4f5]"
        )}
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
          API Keys
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={classNames(
            "transition-transform",
            isExpanded && "rotate-180"
          )}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isExpanded && (
        <div className={classNames(
          isSidebar ? "px-3 pb-3 animate-fade-in" : "px-4 md:px-6 pb-4 animate-fade-in",
        )}>
          <p className={classNames(
            "text-xs mb-4",
            dark ? "text-[#71717a]" : "text-[#a1a1aa]"
          )}>
            Keys are stored in your browser session only. For OpenAI, keys are
            securely proxied through our API routes but never stored.
          </p>

          <div className={classNames(
            "grid grid-cols-1 gap-3",
            !isSidebar && "md:grid-cols-2"
          )}>
            {PROVIDERS_ORDER.map((provider) => {
              const meta = PROVIDER_META[provider];
              const val = validations[provider];
              const isHighlighted = highlightProvider === provider;

              return (
                <div
                  key={provider}
                  className={classNames(
                    "rounded-lg p-3 transition-all",
                    dark ? "bg-[#18181b]" : "bg-[#f4f4f5]",
                    isHighlighted && "ring-2 ring-yellow-500"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={classNames(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        meta.bgClass,
                        meta.textClass
                      )}
                    >
                      {meta.label}
                    </span>
                    {val.status === "validating" && (
                      <span className="text-xs text-[#a1a1aa]">Checking...</span>
                    )}
                    {val.status === "valid" && (
                      <span className="text-xs text-green-500">Verified</span>
                    )}
                    {val.status === "invalid" && (
                      <span className="text-xs text-red-500">{val.error || "Invalid"}</span>
                    )}
                  </div>

                  <input
                    type="password"
                    placeholder={
                      provider === "aws-transcribe"
                        ? "Access Key ID"
                        : `${meta.label} API Key`
                    }
                    value={keys[provider]}
                    onChange={(e) =>
                      onKeysChange({ ...keys, [provider]: e.target.value })
                    }
                    onBlur={() => {
                      if (keys[provider]) validateKey(provider);
                    }}
                    className={classNames(
                      "w-full px-3 py-2 rounded-md text-sm outline-none transition-colors",
                      dark
                        ? "bg-[#09090b] border border-[#27272a] text-white placeholder:text-[#52525b] focus:border-[#3f3f46]"
                        : "bg-white border border-[#e4e4e7] text-[#09090b] placeholder:text-[#a1a1aa] focus:border-[#d4d4d8]"
                    )}
                  />

                  {provider === "azure" && (
                    <input
                      type="text"
                      placeholder="Region (e.g. eastus)"
                      value={keys.azureRegion}
                      onChange={(e) =>
                        onKeysChange({ ...keys, azureRegion: e.target.value })
                      }
                      className={classNames(
                        "w-full px-3 py-2 rounded-md text-sm outline-none mt-2 transition-colors",
                        dark
                          ? "bg-[#09090b] border border-[#27272a] text-white placeholder:text-[#52525b] focus:border-[#3f3f46]"
                          : "bg-white border border-[#e4e4e7] text-[#09090b] placeholder:text-[#a1a1aa] focus:border-[#d4d4d8]"
                      )}
                    />
                  )}

                  {provider === "aws-transcribe" && (
                    <>
                      <input
                        type="password"
                        placeholder="Secret Access Key"
                        value={keys.awsTranscribeSecret}
                        onChange={(e) =>
                          onKeysChange({ ...keys, awsTranscribeSecret: e.target.value })
                        }
                        onBlur={() => {
                          if (keys["aws-transcribe"] && keys.awsTranscribeSecret && keys.awsTranscribeRegion)
                            validateKey(provider);
                        }}
                        className={classNames(
                          "w-full px-3 py-2 rounded-md text-sm outline-none mt-2 transition-colors",
                          dark
                            ? "bg-[#09090b] border border-[#27272a] text-white placeholder:text-[#52525b] focus:border-[#3f3f46]"
                            : "bg-white border border-[#e4e4e7] text-[#09090b] placeholder:text-[#a1a1aa] focus:border-[#d4d4d8]"
                        )}
                      />
                      <input
                        type="text"
                        placeholder="Region (e.g. us-east-1)"
                        value={keys.awsTranscribeRegion}
                        onChange={(e) =>
                          onKeysChange({ ...keys, awsTranscribeRegion: e.target.value })
                        }
                        onBlur={() => {
                          if (keys["aws-transcribe"] && keys.awsTranscribeSecret && keys.awsTranscribeRegion)
                            validateKey(provider);
                        }}
                        className={classNames(
                          "w-full px-3 py-2 rounded-md text-sm outline-none mt-2 transition-colors",
                          dark
                            ? "bg-[#09090b] border border-[#27272a] text-white placeholder:text-[#52525b] focus:border-[#3f3f46]"
                            : "bg-white border border-[#e4e4e7] text-[#09090b] placeholder:text-[#a1a1aa] focus:border-[#d4d4d8]"
                        )}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
