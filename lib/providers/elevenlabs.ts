import {
  TranscriptionProvider,
  TranscriptionConfig,
  TranscriptResult,
} from "./types";

export class ElevenLabsProvider implements TranscriptionProvider {
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
    const token = await this.fetchSingleUseToken(config.apiKey);

    const params = new URLSearchParams({
      model_id: "scribe_v2_realtime",
      token,
    });

    if (config.language && config.language !== "auto") {
      params.set("language_code", config.language);
    }

    params.set("include_timestamps", "false");

    const url = `wss://api.elevenlabs.io/v1/speech-to-text/realtime?${params.toString()}`;

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

      this.ws.onopen = () => {
        // Wait for session_started before resolving
      };

      this.ws.onerror = () => {
        const err = new Error("ElevenLabs WebSocket connection failed");
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
            `ElevenLabs connection closed: ${ev.reason || ev.code}`
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

          switch (data.message_type) {
            case "session_started":
              if (!settled) {
                settled = true;
                this.startAudioCapture(source, nativeSampleRate, targetSampleRate);
                resolve();
              }
              break;

            case "partial_transcript":
              if (data.text) {
                this.transcriptCb?.({
                  text: data.text,
                  isFinal: false,
                  timestamp: Date.now(),
                });
              }
              break;

            case "committed_transcript":
              if (data.text) {
                this.transcriptCb?.({
                  text: data.text,
                  isFinal: true,
                  timestamp: Date.now(),
                });
              }
              break;

            case "committed_transcript_with_timestamps":
              if (data.text) {
                this.transcriptCb?.({
                  text: data.text,
                  isFinal: true,
                  timestamp: Date.now(),
                });
              }
              break;

            case "auth_error":
            case "quota_exceeded":
            case "transcriber_error":
            case "input_error":
            case "error":
            case "commit_throttled":
            case "unaccepted_terms":
            case "rate_limited":
            case "queue_overflow":
            case "resource_exhausted":
            case "session_time_limit_exceeded":
            case "chunk_size_exceeded":
            case "insufficient_audio_activity":
              this.errorCb?.(
                new Error(`ElevenLabs error (${data.message_type}): ${data.error || data.message || data.message_type}`)
              );
              break;
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

      const base64 = arrayBufferToBase64(pcm16.buffer);

      this.ws.send(
        JSON.stringify({
          message_type: "input_audio_chunk",
          audio_base_64: base64,
          commit: false,
          sample_rate: targetSampleRate,
        })
      );
    };

    source.connect(this.processor);
    this.processor.connect(this.audioContext!.destination);
  }

  private async fetchSingleUseToken(apiKey: string): Promise<string> {
    const res = await fetch("/api/elevenlabs/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Token request failed" }));
      throw new Error(data.error || "Failed to get ElevenLabs single-use token");
    }

    const data = await res.json();
    if (!data.token) {
      throw new Error("No token returned from ElevenLabs");
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
        this.ws.send(
          JSON.stringify({
            message_type: "input_audio_chunk",
            audio_base_64: "",
            commit: true,
            sample_rate: 16000,
          })
        );
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
