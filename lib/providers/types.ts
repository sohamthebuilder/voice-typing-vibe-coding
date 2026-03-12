export type Provider = "openai" | "deepgram" | "azure" | "aws-transcribe" | "assemblyai" | "elevenlabs" | "sarvam";

export interface TranscriptResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
  timestamp?: number;
}

export interface TranscriptionConfig {
  apiKey: string;
  secretKey?: string;
  region?: string;
  model: string;
  language: string;
  punctuate: boolean;
  profanityFilter: boolean;
  modelParams?: Record<string, unknown>;
}

export interface TranscriptionProvider {
  connect(config: TranscriptionConfig): Promise<void>;
  sendAudio(chunk: Blob): void;
  disconnect(): void;
  onTranscript(cb: (result: TranscriptResult) => void): void;
  onError(cb: (error: Error) => void): void;
  readonly isStreaming: boolean;
}
