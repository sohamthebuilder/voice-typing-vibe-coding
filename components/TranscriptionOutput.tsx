"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { TranscriptSegment } from "@/hooks/useTranscription";
import { classNames, countWords } from "@/lib/utils";

interface TranscriptionOutputProps {
  theme: "dark" | "light";
  segments: TranscriptSegment[];
  fullText: string;
  onClear: () => void;
}

export function TranscriptionOutput({
  theme,
  segments,
  fullText,
  onClear,
}: TranscriptionOutputProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [editedText, setEditedText] = useState<string | null>(null);

  const isEditing = editedText !== null;
  const displayText = isEditing ? editedText : fullText;
  const wordCount = countWords(displayText);

  useEffect(() => {
    if (!isEditing) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [segments, isEditing]);

  useEffect(() => {
    setEditedText(null);
  }, [fullText]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API might fail in some browsers
    }
  }, [displayText]);

  const dark = theme === "dark";
  const isEmpty = segments.length === 0 && !isEditing;

  return (
    <div
      className={classNames(
        "flex flex-col h-full rounded-xl border overflow-hidden",
        dark ? "bg-[#18181b] border-[#27272a]" : "bg-white border-[#e4e4e7]"
      )}
    >
      <div
        className={classNames(
          "flex items-center justify-between px-4 py-2.5 border-b shrink-0",
          dark ? "border-[#27272a]" : "border-[#e4e4e7]"
        )}
      >
        <span className={classNames(
          "text-xs font-medium",
          dark ? "text-[#71717a]" : "text-[#a1a1aa]"
        )}>
          {wordCount > 0 ? `${wordCount} word${wordCount !== 1 ? "s" : ""}` : "Transcription"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={copyToClipboard}
            disabled={!displayText}
            className={classNames(
              "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              dark
                ? "hover:bg-[#27272a] text-[#a1a1aa] hover:text-white"
                : "hover:bg-[#f4f4f5] text-[#71717a] hover:text-[#09090b]",
              !displayText && "opacity-50 cursor-not-allowed"
            )}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={onClear}
            disabled={isEmpty}
            className={classNames(
              "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              dark
                ? "hover:bg-[#27272a] text-[#a1a1aa] hover:text-white"
                : "hover:bg-[#f4f4f5] text-[#71717a] hover:text-[#09090b]",
              isEmpty && "opacity-50 cursor-not-allowed"
            )}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {isEmpty ? (
          <p className={classNames(
            "text-sm italic",
            dark ? "text-[#3f3f46]" : "text-[#d4d4d8]"
          )}>
            Your words will appear here in real time...
          </p>
        ) : isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className={classNames(
              "w-full h-full resize-none outline-none text-sm leading-relaxed",
              dark ? "bg-transparent text-white" : "bg-transparent text-[#09090b]"
            )}
          />
        ) : (
          <div className="text-sm leading-relaxed">
            {segments.map((seg) => (
              <span
                key={seg.id}
                className={classNames(
                  "transition-opacity duration-200",
                  seg.isFinal
                    ? dark ? "text-white" : "text-[#09090b]"
                    : dark ? "text-[#71717a]" : "text-[#a1a1aa]"
                )}
              >
                {seg.text}{" "}
              </span>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>
    </div>
  );
}
