"use client";

import { useEffect, useState, useCallback } from "react";
import { classNames } from "@/lib/utils";

export interface ToastMessage {
  id: number;
  text: string;
  type: "error" | "success" | "info";
}

let toastIdCounter = 0;

const listeners: Set<(t: ToastMessage) => void> = new Set();

export function showToast(text: string, type: ToastMessage["type"] = "error") {
  const msg: ToastMessage = { id: ++toastIdCounter, text, type };
  listeners.forEach((fn) => fn(msg));
}

export function ToastContainer({ theme }: { theme: "dark" | "light" }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((msg: ToastMessage) => {
    setToasts((prev) => [...prev, msg]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== msg.id));
    }, 5000);
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => { listeners.delete(addToast); };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={classNames(
            "animate-toast-in rounded-lg px-4 py-3 text-sm shadow-lg flex items-start gap-2",
            theme === "dark" ? "bg-[#27272a] text-white" : "bg-white text-[#09090b] border border-[#e4e4e7]",
            t.type === "error" && "border-l-4 border-l-red-500",
            t.type === "success" && "border-l-4 border-l-green-500",
            t.type === "info" && "border-l-4 border-l-blue-500"
          )}
        >
          <span className="flex-1">{t.text}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="text-[#a1a1aa] hover:text-white shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
