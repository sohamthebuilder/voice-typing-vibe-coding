import {
  TranscriptionProvider,
  TranscriptionConfig,
  TranscriptResult,
} from "./types";

export class DeepgramProvider implements TranscriptionProvider {
  private ws: WebSocket | null = null;
  private transcriptCb: ((r: TranscriptResult) => void) | null = null;
  private errorCb: ((e: Error) => void) | null = null;
  private closingIntentionally = false;
  readonly isStreaming = true;

  onTranscript(cb: (r: TranscriptResult) => void) {
    this.transcriptCb = cb;
  }

  onError(cb: (e: Error) => void) {
    this.errorCb = cb;
  }

  async connect(config: TranscriptionConfig): Promise<void> {
    const params = new URLSearchParams({
      model: config.model,
      punctuate: String(config.punctuate),
      profanity_filter: String(config.profanityFilter),
      interim_results: "true",
    });

    if (config.language && config.language !== "auto") {
      params.set("language", config.language);
    } else {
      params.set("detect_language", "true");
    }

    const mp = config.modelParams ?? {};
    if (mp.smart_format !== undefined) params.set("smart_format", String(mp.smart_format));
    if (mp.diarize !== undefined) params.set("diarize", String(mp.diarize));
    if (mp.filler_words !== undefined) params.set("filler_words", String(mp.filler_words));
    if (typeof mp.endpointing === "number") params.set("endpointing", String(mp.endpointing));
    if (typeof mp.keywords === "string" && mp.keywords.trim()) {
      for (const kw of mp.keywords.split(",").map((s: string) => s.trim()).filter(Boolean)) {
        params.append("keywords", kw);
      }
    }

    const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

    return new Promise((resolve, reject) => {
      let settled = false;
      this.ws = new WebSocket(url, ["token", config.apiKey]);

      this.ws.onopen = () => {
        settled = true;
        resolve();
      };

      this.ws.onerror = () => {
        const err = new Error("Deepgram WebSocket connection failed");
        this.errorCb?.(err);
        if (!settled) {
          settled = true;
          reject(err);
        }
      };

      this.ws.onclose = (ev) => {
        if (ev.code !== 1000 && ev.code !== 1001 && ev.code !== 1005 && !this.closingIntentionally) {
          const closeErr = new Error(`Deepgram connection closed: ${ev.reason || ev.code}`);
          this.errorCb?.(closeErr);
          if (!settled) {
            settled = true;
            reject(closeErr);
          }
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "Results") {
            const alt = data.channel?.alternatives?.[0];
            if (alt && alt.transcript) {
              this.transcriptCb?.({
                text: alt.transcript,
                isFinal: data.is_final ?? false,
                confidence: alt.confidence,
                timestamp: Date.now(),
              });
            }
          }
        } catch {
          // ignore malformed messages
        }
      };
    });
  }

  sendAudio(chunk: Blob) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      chunk.arrayBuffer().then((buf) => this.ws?.send(buf));
    }
  }

  disconnect() {
    if (this.ws) {
      this.closingIntentionally = true;
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "CloseStream" }));
      }
      this.ws.close();
      this.ws = null;
    }
  }
}
