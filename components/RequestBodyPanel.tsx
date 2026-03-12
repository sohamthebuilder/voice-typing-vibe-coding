"use client";

import { useState } from "react";
import { classNames } from "@/lib/utils";
import { Provider } from "@/lib/providers/types";

export interface RequestBody {
  provider: Provider;
  apiKey: string;
  secretKey?: string;
  region?: string;
  model: string;
  language: string;
  punctuate: boolean;
  profanityFilter: boolean;
  modelParams?: Record<string, unknown>;
}

function maskSecret(value: string): string {
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 4) + "••••" + value.slice(-4);
}

function formatValue(key: string, value: unknown): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if ((key === "apiKey" || key === "secretKey") && typeof value === "string") {
    return maskSecret(value);
  }
  return String(value);
}

export function RequestBodyPanel({
  theme,
  requestBody,
}: {
  theme: "light" | "dark";
  requestBody: RequestBody | null;
}) {
  const [open, setOpen] = useState(false);
  const dark = theme === "dark";

  return (
    <div
      className={classNames(
        "rounded-lg border text-xs",
        dark ? "border-[#27272a] bg-[#18181b]" : "border-[#e4e4e7] bg-white"
      )}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className={classNames(
          "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
          dark ? "hover:bg-[#27272a] text-[#a1a1aa]" : "hover:bg-[#f4f4f5] text-[#71717a]"
        )}
      >
        <span className="flex items-center gap-1.5 font-medium">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 18l2-2v-3a2 2 0 0 0-4 0v3l2 2z" />
            <path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          </svg>
          Request Body
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={classNames("transition-transform", open ? "rotate-180" : "")}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className={classNames("px-3 pb-3", !requestBody && "pt-1")}>
          {requestBody ? (
            <div
              className={classNames(
                "rounded-md p-2 font-mono text-[11px] leading-relaxed overflow-x-auto",
                dark ? "bg-[#0f0f11] text-[#d4d4d8]" : "bg-[#f4f4f5] text-[#27272a]"
              )}
            >
              <div className={dark ? "text-[#52525b]" : "text-[#a1a1aa]"}>{"{"}</div>
              {Object.entries(requestBody).map(([key, value]) => {
                if (value === undefined) return null;
                const isSecret = key === "apiKey" || key === "secretKey";

                if (key === "modelParams" && typeof value === "object" && value !== null) {
                  const entries = Object.entries(value as Record<string, unknown>).filter(
                    ([, v]) => v !== undefined && v !== ""
                  );
                  if (entries.length === 0) return null;
                  return (
                    <div key={key}>
                      <div className="pl-4 flex gap-1">
                        <span className={dark ? "text-[#a78bfa]" : "text-[#7c3aed]"}>
                          &quot;{key}&quot;
                        </span>
                        <span className={dark ? "text-[#52525b]" : "text-[#a1a1aa]"}>: {"{"}</span>
                      </div>
                      {entries.map(([k, v]) => (
                        <div key={k} className="pl-8 flex gap-1">
                          <span className={dark ? "text-[#a78bfa]" : "text-[#7c3aed]"}>
                            &quot;{k}&quot;
                          </span>
                          <span className={dark ? "text-[#52525b]" : "text-[#a1a1aa]"}>:</span>
                          <span
                            className={
                              typeof v === "boolean"
                                ? dark ? "text-[#38bdf8]" : "text-[#0284c7]"
                                : typeof v === "number"
                                  ? dark ? "text-[#fb923c]" : "text-[#ea580c]"
                                  : dark ? "text-[#4ade80]" : "text-[#16a34a]"
                            }
                          >
                            {typeof v === "boolean" || typeof v === "number"
                              ? String(v)
                              : `"${String(v)}"`}
                          </span>
                        </div>
                      ))}
                      <div className={classNames("pl-4", dark ? "text-[#52525b]" : "text-[#a1a1aa]")}>{"}"}</div>
                    </div>
                  );
                }

                return (
                  <div key={key} className="pl-4 flex gap-1">
                    <span className={dark ? "text-[#a78bfa]" : "text-[#7c3aed]"}>
                      &quot;{key}&quot;
                    </span>
                    <span className={dark ? "text-[#52525b]" : "text-[#a1a1aa]"}>:</span>
                    <span
                      className={classNames(
                        isSecret
                          ? dark ? "text-[#f59e0b]" : "text-[#d97706]"
                          : typeof value === "boolean"
                            ? dark ? "text-[#38bdf8]" : "text-[#0284c7]"
                            : typeof value === "string"
                              ? dark ? "text-[#4ade80]" : "text-[#16a34a]"
                              : ""
                      )}
                    >
                      {typeof value === "boolean"
                        ? formatValue(key, value)
                        : `"${formatValue(key, value)}"`}
                    </span>
                  </div>
                );
              })}
              <div className={dark ? "text-[#52525b]" : "text-[#a1a1aa]"}>{"}"}</div>
            </div>
          ) : (
            <p className={dark ? "text-[#52525b]" : "text-[#a1a1aa]"}>
              Click record to see the request body.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
