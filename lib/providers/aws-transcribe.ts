import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
  StartMedicalStreamTranscriptionCommand,
  type AudioStream as AwsAudioStream,
  type LanguageCode,
  type PartialResultsStability as PartialResultsStabilityType,
} from "@aws-sdk/client-transcribe-streaming";
import {
  TranscriptionProvider,
  TranscriptionConfig,
  TranscriptResult,
} from "./types";

class AudioChunkQueue {
  private queue: Uint8Array[] = [];
  private waiting: ((v: void) => void) | null = null;
  private done = false;

  push(chunk: Uint8Array) {
    this.queue.push(chunk);
    this.waiting?.();
    this.waiting = null;
  }

  end() {
    this.done = true;
    this.waiting?.();
    this.waiting = null;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<Uint8Array> {
    while (!this.done) {
      if (this.queue.length > 0) {
        yield this.queue.shift()!;
      } else {
        await new Promise<void>((r) => {
          this.waiting = r;
        });
      }
    }
    while (this.queue.length > 0) {
      yield this.queue.shift()!;
    }
  }
}

export class AwsTranscribeProvider implements TranscriptionProvider {
  private transcriptCb: ((r: TranscriptResult) => void) | null = null;
  private errorCb: ((e: Error) => void) | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private audioQueue: AudioChunkQueue | null = null;
  private active = false;
  readonly isStreaming = true;

  onTranscript(cb: (r: TranscriptResult) => void) {
    this.transcriptCb = cb;
  }

  onError(cb: (e: Error) => void) {
    this.errorCb = cb;
  }

  async connect(config: TranscriptionConfig): Promise<void> {
    if (!config.region) {
      throw new Error("AWS region is required");
    }
    if (!config.secretKey) {
      throw new Error("AWS Secret Access Key is required");
    }

    const client = new TranscribeStreamingClient({
      region: config.region,
      credentials: {
        accessKeyId: config.apiKey,
        secretAccessKey: config.secretKey,
      },
    });

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    const nativeSampleRate = this.audioContext.sampleRate;
    const targetSampleRate = 16000;

    this.audioQueue = new AudioChunkQueue();
    this.active = true;

    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e) => {
      if (!this.active) return;
      const float32 = e.inputBuffer.getChannelData(0);
      const pcm16 = downsampleToPcm16(float32, nativeSampleRate, targetSampleRate);
      this.audioQueue?.push(new Uint8Array(pcm16.buffer));
    };

    source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    const isMedical = config.model === "aws-transcribe-medical";
    const langCode = config.language === "auto" ? "en-US" : config.language;

    try {
      if (isMedical) {
        const command = new StartMedicalStreamTranscriptionCommand({
          LanguageCode: langCode as LanguageCode,
          MediaEncoding: "pcm",
          MediaSampleRateHertz: targetSampleRate,
          Specialty: "PRIMARYCARE",
          Type: "DICTATION",
          AudioStream: this.createAudioStream(),
        });
        const response = await client.send(command);
        this.processResultStream(response.TranscriptResultStream);
      } else {
        const useAutoDetect = config.language === "auto";
        const mp = config.modelParams ?? {};
        const stability = (typeof mp.partialResultsStability === "string"
          ? mp.partialResultsStability
          : "medium") as PartialResultsStabilityType;
        const command = new StartStreamTranscriptionCommand({
          LanguageCode: useAutoDetect ? undefined : (langCode as LanguageCode),
          IdentifyLanguage: useAutoDetect || undefined,
          MediaEncoding: "pcm",
          MediaSampleRateHertz: targetSampleRate,
          AudioStream: this.createAudioStream(),
          EnablePartialResultsStabilization: true,
          PartialResultsStability: stability,
          ShowSpeakerLabel: mp.showSpeakerLabel === true || undefined,
          VocabularyName: typeof mp.vocabularyName === "string" && mp.vocabularyName.trim()
            ? mp.vocabularyName.trim()
            : undefined,
        });
        const response = await client.send(command);
        this.processResultStream(response.TranscriptResultStream);
      }
    } catch (err) {
      this.cleanup();
      throw err;
    }
  }

  private async *createAudioStream(): AsyncGenerator<AwsAudioStream> {
    if (!this.audioQueue) return;
    for await (const chunk of this.audioQueue) {
      yield { AudioEvent: { AudioChunk: chunk } };
    }
  }

  private async processResultStream(stream: AsyncIterable<unknown> | undefined) {
    if (!stream) return;
    try {
      for await (const event of stream as AsyncIterable<Record<string, unknown>>) {
        if (!this.active) break;

        const transcriptEvent =
          (event as { TranscriptEvent?: { Transcript?: { Results?: TranscribeResult[] } } })
            .TranscriptEvent;

        if (transcriptEvent?.Transcript?.Results) {
          for (const result of transcriptEvent.Transcript.Results) {
            const alt = result.Alternatives?.[0];
            if (alt?.Transcript) {
              this.transcriptCb?.({
                text: alt.Transcript,
                isFinal: !result.IsPartial,
                timestamp: Date.now(),
              });
            }
          }
        }
      }
    } catch (err) {
      if (this.active) {
        this.errorCb?.(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  sendAudio(_chunk: Blob) {
    // Audio capture is managed internally via Web Audio API
  }

  disconnect() {
    this.active = false;
    this.audioQueue?.end();
    this.cleanup();
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
    this.audioQueue = null;
  }
}

interface TranscribeResult {
  Alternatives?: { Transcript?: string }[];
  IsPartial?: boolean;
}

function downsampleToPcm16(
  float32: Float32Array,
  fromRate: number,
  toRate: number,
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
