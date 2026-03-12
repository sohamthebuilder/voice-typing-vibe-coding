"use client";

import { classNames, formatDuration } from "@/lib/utils";

interface RecordButtonProps {
  theme: "dark" | "light";
  isRecording: boolean;
  duration: number;
  onToggle: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function RecordButton({
  theme,
  isRecording,
  duration,
  onToggle,
  disabled,
  disabledReason,
}: RecordButtonProps) {
  const dark = theme === "dark";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-red-500/40 animate-pulse-ring" />
        )}
        <button
          onClick={onToggle}
          disabled={disabled}
          title={disabled ? disabledReason : isRecording ? "Stop recording" : "Start recording"}
          className={classNames(
            "relative w-16 h-16 rounded-full flex items-center justify-center transition-all",
            isRecording
              ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25"
              : dark
                ? "bg-[#3f3f46] hover:bg-[#52525b]"
                : "bg-[#d4d4d8] hover:bg-[#a1a1aa]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {isRecording ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}
        </button>
      </div>

      {isRecording && (
        <span className="text-sm font-mono text-red-500 tabular-nums">
          {formatDuration(duration)}
        </span>
      )}

      {disabled && disabledReason && (
        <p className={classNames(
          "text-xs text-center max-w-48",
          dark ? "text-amber-400" : "text-amber-600"
        )}>
          {disabledReason}
        </p>
      )}
    </div>
  );
}
