"use client";

import { useState, useRef, useEffect } from "react";
import { UNIFIED_LANGUAGES } from "@/lib/languages";
import { classNames } from "@/lib/utils";

interface LanguageSelectorProps {
  theme: "dark" | "light";
  selectedLanguage: string | null;
  onSelect: (code: string) => void;
  disabled?: boolean;
}

export function LanguageSelector({
  theme,
  selectedLanguage,
  onSelect,
  disabled,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = search
    ? UNIFIED_LANGUAGES.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.code.toLowerCase().includes(search.toLowerCase())
      )
    : UNIFIED_LANGUAGES;

  const selectedLang = selectedLanguage
    ? UNIFIED_LANGUAGES.find((l) => l.code === selectedLanguage)
    : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dark = theme === "dark";

  return (
    <div ref={ref} className="relative">
      <label
        className={classNames(
          "block text-xs font-medium mb-1.5",
          dark ? "text-[#a1a1aa]" : "text-[#71717a]"
        )}
      >
        Language
      </label>
      <button
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        className={classNames(
          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
          dark
            ? "bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46]"
            : "bg-white border border-[#e4e4e7] hover:border-[#d4d4d8]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          className={
            dark
              ? selectedLang
                ? "text-white"
                : "text-[#52525b]"
              : selectedLang
                ? "text-[#09090b]"
                : "text-[#a1a1aa]"
          }
        >
          {selectedLang?.name ?? "Select a language..."}
        </span>
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
            "absolute z-40 w-full mt-1 rounded-lg border shadow-xl max-h-72 overflow-hidden animate-fade-in",
            dark
              ? "bg-[#18181b] border-[#27272a]"
              : "bg-white border-[#e4e4e7]"
          )}
        >
          <div className="p-2">
            <input
              type="text"
              placeholder="Search languages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={classNames(
                "w-full px-3 py-2 rounded-md text-sm outline-none",
                dark
                  ? "bg-[#09090b] border border-[#27272a] text-white placeholder:text-[#52525b]"
                  : "bg-[#f4f4f5] border border-[#e4e4e7] text-[#09090b] placeholder:text-[#a1a1aa]"
              )}
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onSelect(lang.code);
                  setIsOpen(false);
                  setSearch("");
                }}
                className={classNames(
                  "w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors",
                  dark
                    ? "hover:bg-[#27272a] text-white"
                    : "hover:bg-[#f4f4f5] text-[#09090b]",
                  selectedLanguage === lang.code &&
                    (dark ? "bg-[#27272a]" : "bg-[#f4f4f5]")
                )}
              >
                <span>{lang.name}</span>
                <span
                  className={classNames(
                    "text-xs",
                    dark ? "text-[#52525b]" : "text-[#a1a1aa]"
                  )}
                >
                  {lang.code}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div
                className={classNames(
                  "px-3 py-4 text-sm text-center",
                  dark ? "text-[#52525b]" : "text-[#a1a1aa]"
                )}
              >
                No languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
