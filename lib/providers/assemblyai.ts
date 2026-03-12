import {
  TranscriptionProvider,
  TranscriptionConfig,
  TranscriptResult,
} from "./types";

export class AssemblyAIProvider implements TranscriptionProvider {
  private ws: WebSocket | null = null;
  private transcriptCb: ((r: TranscriptResult) => void) | null = null;
  private errorCb: ((e: Error) => void) | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private active = false;
  readonly isStreaming = true;

  onTranscript(cb: (r: TranscriptResult) => void) {
    this.transcriptCb = cb;
  }

  onError(cb: (e: Error) => void) {
    this.errorCb = cb;
  }

  async connect(config: TranscriptionConfig): Promise<void> {
    const tempToken = await this.fetchTemporaryToken(config.apiKey);

    const params = new URLSearchParams({
      speech_model: config.model,
      sample_rate: "16000",
      token: tempToken,
      format_turns: "true",
    });

    const mp = config.modelParams ?? {};
    if (typeof mp.word_boost === "string" && mp.word_boost.trim()) {
      const words = mp.word_boost.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (words.length > 0) {
        params.set("word_boost", JSON.stringify(words));
      }
    }

    const url = `wss://streaming.assemblyai.com/v3/ws?${params.toString()}`;

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    const nativeSampleRate = this.audioContext.sampleRate;
    const targetSampleRate = 16000;

    this.active = true;

    return new Promise((resolve, reject) => {
      let settled = false;

      this.ws = new WebSocket(url);

      this.ws.binaryType = "arraybuffer";

      this.ws.onopen = () => {
        this.startAudioCapture(source, nativeSampleRate, targetSampleRate);
        settled = true;
        resolve();
      };

      this.ws.onerror = () => {
        const err = new Error("AssemblyAI WebSocket connection failed");
        this.errorCb?.(err);
        if (!settled) {
          settled = true;
          this.cleanup();
          reject(err);
        }
      };

      this.ws.onclose = (ev) => {
        if (ev.code !== 1000 && ev.code !== 1001 && ev.code !== 1005 && this.active) {
          const closeErr = new Error(
            `AssemblyAI connection closed: ${ev.reason || ev.code}`
          );
          this.errorCb?.(closeErr);
          if (!settled) {
            settled = true;
            this.cleanup();
            reject(closeErr);
          }
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "Turn") {
            const transcript = data.transcript || "";
            if (transcript) {
              this.transcriptCb?.({
                text: transcript,
                isFinal: !!data.turn_is_formatted,
                timestamp: Date.now(),
              });
            }
          } else if (data.type === "Termination") {
            this.cleanup();
          }
        } catch {
          // ignore malformed messages
        }
      };
    });
  }

  private startAudioCapture(
    source: MediaStreamAudioSourceNode,
    nativeSampleRate: number,
    targetSampleRate: number
  ) {
    this.processor = this.audioContext!.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.active || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const float32 = e.inputBuffer.getChannelData(0);
      const pcm16 = downsampleToPcm16(float32, nativeSampleRate, targetSampleRate);
      this.ws.send(pcm16.buffer);
    };

    source.connect(this.processor);
    this.processor.connect(this.audioContext!.destination);
  }

  private async fetchTemporaryToken(apiKey: string): Promise<string> {
    const res = await fetch("/api/assemblyai/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Token request failed" }));
      throw new Error(data.error || "Failed to get AssemblyAI temporary token");
    }

    const data = await res.json();
    if (!data.token) {
      throw new Error("No token returned from AssemblyAI");
    }
    return data.token;
  }

  sendAudio(_chunk: Blob) {
    // Audio capture is managed internally via Web Audio API (PCM16 at 16kHz)
  }

  disconnect() {
    this.active = false;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: "Terminate" }));
      } catch {
        // ignore send errors during disconnect
      }
    }

    setTimeout(() => {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.cleanup();
    }, 500);
  }

  private cleanup() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.mediaStream = null;
  }
}

function downsampleToPcm16(
  float32: Float32Array,
  fromRate: number,
  toRate: number
): Int16Array {
  const ratio = fromRate / toRate;
  const length = Math.floor(float32.length / ratio);
  const result = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    const srcIdx = Math.floor(i * ratio);
    const s = Math.max(-1, Math.min(1, float32[srcIdx]));
    result[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return result;
}
