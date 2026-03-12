import {
  TranscriptionProvider,
  TranscriptionConfig,
  TranscriptResult,
} from "./types";

export class SarvamProvider implements TranscriptionProvider {
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
    const params = new URLSearchParams();

    if (config.language && config.language !== "auto") {
      params.set("language-code", config.language);
    } else {
      params.set("language-code", "unknown");
    }

    params.set("model", config.model);
    params.set("sample_rate", "16000");
    params.set("input_audio_codec", "pcm_s16le");

    const mp = config.modelParams ?? {};
    if (mp.mode && typeof mp.mode === "string") {
      params.set("mode", mp.mode);
    }
    if (mp.high_vad_sensitivity !== undefined) {
      params.set("high_vad_sensitivity", String(mp.high_vad_sensitivity));
    }
    if (mp.vad_signals !== undefined) {
      params.set("vad_signals", String(mp.vad_signals));
    }

    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = typeof window !== "undefined" ? window.location.host : "";
    const proxyUrl = `${protocol}//${host}/api/sarvam-ws?${params.toString()}`;

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

      this.ws = new WebSocket(proxyUrl);

      this.ws.onopen = () => {
        this.ws?.send(JSON.stringify({ apiKey: config.apiKey }));
      };

      this.ws.onerror = () => {
        const err = new Error("Sarvam WebSocket connection failed");
        this.errorCb?.(err);
        if (!settled) {
          settled = true;
          this.cleanup();
          reject(err);
        }
      };

      this.ws.onclose = (ev) => {
        if (
          ev.code !== 1000 &&
          ev.code !== 1001 &&
          ev.code !== 1005 &&
          this.active
        ) {
          const closeErr = new Error(
            `Sarvam connection closed: ${ev.reason || ev.code}`
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
          const msg = JSON.parse(event.data);

          if (msg.type === "proxy_ready") {
            if (!settled) {
              settled = true;
              this.startAudioCapture(source, nativeSampleRate, targetSampleRate);
              resolve();
            }
            return;
          }

          if (msg.type === "data" && msg.data) {
            const transcript = msg.data.transcript;
            if (transcript) {
              this.transcriptCb?.({
                text: transcript,
                isFinal: true,
                confidence: msg.data.language_probability ?? undefined,
                timestamp: Date.now(),
              });
            }
          } else if (msg.type === "error" && msg.data) {
            this.errorCb?.(
              new Error(
                `Sarvam error (${msg.data.code}): ${msg.data.error}`
              )
            );
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
      if (!this.active || !this.ws || this.ws.readyState !== WebSocket.OPEN)
        return;

      const float32 = e.inputBuffer.getChannelData(0);
      const pcm16 = downsampleToPcm16(float32, nativeSampleRate, targetSampleRate);
      const base64 = arrayBufferToBase64(pcm16.buffer);

      this.ws.send(
        JSON.stringify({
          audio: {
            data: base64,
            sample_rate: "16000",
            encoding: "audio/wav",
          },
        })
      );
    };

    source.connect(this.processor);
    this.processor.connect(this.audioContext!.destination);
  }

  sendAudio(_chunk: Blob) {
    // Audio capture is managed internally via Web Audio API (PCM16 at 16kHz)
  }

  disconnect() {
    this.active = false;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: "flush" }));
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

function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
