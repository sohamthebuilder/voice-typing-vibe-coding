"use client";

import { classNames } from "@/lib/utils";

interface AudioVisualizerProps {
  theme: "dark" | "light";
  audioLevel: number;
  isRecording: boolean;
}

const BAR_COUNT = 5;

export function AudioVisualizer({ theme, audioLevel, isRecording }: AudioVisualizerProps) {
  if (!isRecording) return null;

  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const centerDist = Math.abs(i - Math.floor(BAR_COUNT / 2));
    const scale = Math.max(0.15, audioLevel * (1 - centerDist * 0.2));
    return scale;
  });

  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {bars.map((scale, i) => (
        <div
          key={i}
          className={classNames(
            "w-1 rounded-full transition-all duration-75",
            theme === "dark" ? "bg-red-500" : "bg-red-500"
          )}
          style={{
            height: `${Math.max(4, scale * 32)}px`,
          }}
        />
      ))}
    </div>
  );
}
