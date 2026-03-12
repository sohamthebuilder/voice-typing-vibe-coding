export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function isBrowserSupported(): boolean {
  if (typeof window === "undefined") return true;
  const hasGetUserMedia = typeof navigator.mediaDevices?.getUserMedia === "function";
  const hasMediaRecorder = typeof window.MediaRecorder === "function";
  const hasAudioContext = typeof window.AudioContext === "function";
  return hasGetUserMedia && hasMediaRecorder && hasAudioContext;
}
