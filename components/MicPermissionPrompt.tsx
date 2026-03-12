"use client";

import { classNames } from "@/lib/utils";

interface MicPermissionPromptProps {
  theme: "dark" | "light";
  onDismiss: () => void;
}

export function MicPermissionPrompt({ theme, onDismiss }: MicPermissionPromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={classNames(
          "rounded-2xl p-8 max-w-md w-full mx-4 animate-fade-in",
          theme === "dark" ? "bg-[#18181b]" : "bg-white"
        )}
      >
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
            <line x1="2" x2="22" y1="2" y2="22" />
          </svg>
        </div>

        <h2
          className={classNames(
            "text-xl font-semibold text-center mb-2",
            theme === "dark" ? "text-white" : "text-[#09090b]"
          )}
        >
          Microphone Access Required
        </h2>

        <p
          className={classNames(
            "text-center mb-6",
            theme === "dark" ? "text-[#a1a1aa]" : "text-[#71717a]"
          )}
        >
          VoiceDrop needs access to your microphone to transcribe your speech.
        </p>

        <div
          className={classNames(
            "rounded-lg p-4 mb-6 text-sm space-y-2",
            theme === "dark" ? "bg-[#09090b]" : "bg-[#f4f4f5]"
          )}
        >
          <p className={theme === "dark" ? "text-[#a1a1aa]" : "text-[#71717a]"}>
            <strong className={theme === "dark" ? "text-white" : "text-[#09090b]"}>Chrome / Edge:</strong>{" "}
            Click the lock icon in the address bar, find &quot;Microphone&quot;, and set to &quot;Allow&quot;.
          </p>
          <p className={theme === "dark" ? "text-[#a1a1aa]" : "text-[#71717a]"}>
            <strong className={theme === "dark" ? "text-white" : "text-[#09090b]"}>Firefox:</strong>{" "}
            Click the permissions icon (left of address bar) and allow microphone access.
          </p>
          <p className={theme === "dark" ? "text-[#a1a1aa]" : "text-[#71717a]"}>
            <strong className={theme === "dark" ? "text-white" : "text-[#09090b]"}>Safari:</strong>{" "}
            Go to Safari → Settings → Websites → Microphone and set to &quot;Allow&quot;.
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="w-full py-2.5 rounded-lg bg-white text-black font-medium hover:bg-gray-100 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
