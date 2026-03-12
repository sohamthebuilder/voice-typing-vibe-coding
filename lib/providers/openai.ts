import {
  TranscriptionProvider,
  TranscriptionConfig,
  TranscriptResult,
} from "./types";

export class OpenAIProvider implements TranscriptionProvider {
  private transcriptCb: ((r: TranscriptResult) => void) | null = null;
  private errorCb: ((e: Error) => void) | null = null;
  private config: TranscriptionConfig | null = null;
  private active = false;
  readonly isStreaming = false;

  // WebM chunks from MediaRecorder: only the first chunk carries the container
  // header, so we must accumulate all chunks and send the full blob each time
  // to produce a valid file for the OpenAI API.
  private chunks: Blob[] = [];
  private sending = false;
  private queued = false;
  private lastText = "";

  onTranscript(cb: (r: TranscriptResult) => void) {
    this.transcriptCb = cb;
  }

  onError(cb: (e: Error) => void) {
    this.errorCb = cb;
  }

  async connect(config: TranscriptionConfig): Promise<void> {
    this.config = config;
    this.active = true;
    this.chunks = [];
    this.sending = false;
    this.queued = false;
    this.lastText = "";
  }

  async sendAudio(chunk: Blob) {
    if (!this.active || !this.config) return;

    this.chunks.push(chunk);

    if (this.sending) {
      this.queued = true;
      return;
    }

    await this.flush();
  }

  private async flush() {
    if (!this.active || !this.config || this.chunks.length === 0) return;

    this.sending = true;
    this.queued = false;

    const combinedBlob = new Blob(this.chunks, { type: "audio/webm" });

    const formData = new FormData();
    formData.append("audio", combinedBlob, "audio.webm");
    formData.append("apiKey", this.config.apiKey);
    formData.append("model", this.config.model);
    if (this.config.language && this.config.language !== "auto") {
      formData.append("language", this.config.language);
    }

    const mp = this.config.modelParams ?? {};
    if (typeof mp.prompt === "string" && mp.prompt.trim()) {
      formData.append("prompt", mp.prompt.trim());
    }
    if (typeof mp.temperature === "number") {
      formData.append("temperature", String(mp.temperature));
    }

    try {
      const res = await fetch("/api/transcribe/openai", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenAI transcription failed: ${body}`);
      }

      const data = await res.json();
      if (data.text && this.active) {
        this.lastText = data.text;
        this.transcriptCb?.({
          text: data.text,
          isFinal: false,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      this.errorCb?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      this.sending = false;
    }

    if (this.queued && this.active) {
      await this.flush();
    }
  }

  disconnect() {
    if (this.lastText && this.transcriptCb) {
      this.transcriptCb({
        text: this.lastText,
        isFinal: true,
        timestamp: Date.now(),
      });
    }
    this.active = false;
    this.config = null;
    this.chunks = [];
    this.sending = false;
    this.queued = false;
    this.lastText = "";
  }
}
