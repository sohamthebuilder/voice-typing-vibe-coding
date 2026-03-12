import {
  TranscriptionProvider,
  TranscriptionConfig,
  TranscriptResult,
} from "./types";

type SpeechSDK = typeof import("microsoft-cognitiveservices-speech-sdk");

let sdkPromise: Promise<SpeechSDK> | null = null;

function loadSdk(): Promise<SpeechSDK> {
  if (!sdkPromise) {
    sdkPromise = import("microsoft-cognitiveservices-speech-sdk");
  }
  return sdkPromise;
}

export class AzureProvider implements TranscriptionProvider {
  private recognizer: import("microsoft-cognitiveservices-speech-sdk").SpeechRecognizer | null = null;
  private transcriptCb: ((r: TranscriptResult) => void) | null = null;
  private errorCb: ((e: Error) => void) | null = null;
  readonly isStreaming = true;

  onTranscript(cb: (r: TranscriptResult) => void) {
    this.transcriptCb = cb;
  }

  onError(cb: (e: Error) => void) {
    this.errorCb = cb;
  }

  async connect(config: TranscriptionConfig): Promise<void> {
    const sdk = await loadSdk();

    if (!config.region) {
      throw new Error("Azure region is required");
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      config.apiKey,
      config.region
    );

    if (config.language && config.language !== "auto") {
      speechConfig.speechRecognitionLanguage = config.language;
    }

    if (config.punctuate) {
      speechConfig.setProfanity(
        config.profanityFilter
          ? sdk.ProfanityOption.Masked
          : sdk.ProfanityOption.Raw
      );
    }

    switch (config.model) {
      case "azure-stt-conversation":
        speechConfig.setServiceProperty(
          "speechcontext-speechtotext.system.mode",
          "conversation",
          sdk.ServicePropertyChannel.UriQueryParameter
        );
        break;
      case "azure-stt-dictation":
        speechConfig.setServiceProperty(
          "speechcontext-speechtotext.system.mode",
          "dictation",
          sdk.ServicePropertyChannel.UriQueryParameter
        );
        break;
      case "azure-stt-interactive":
        speechConfig.setServiceProperty(
          "speechcontext-speechtotext.system.mode",
          "interactive",
          sdk.ServicePropertyChannel.UriQueryParameter
        );
        break;
    }

    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    this.recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    this.recognizer.recognizing = (_s, e) => {
      if (e.result.text) {
        this.transcriptCb?.({
          text: e.result.text,
          isFinal: false,
          timestamp: Date.now(),
        });
      }
    };

    this.recognizer.recognized = (_s, e) => {
      if (
        e.result.reason === sdk.ResultReason.RecognizedSpeech &&
        e.result.text
      ) {
        this.transcriptCb?.({
          text: e.result.text,
          isFinal: true,
          timestamp: Date.now(),
        });
      }
    };

    this.recognizer.canceled = (_s, e) => {
      if (e.reason === sdk.CancellationReason.Error) {
        this.errorCb?.(new Error(`Azure STT error: ${e.errorDetails}`));
      }
    };

    return new Promise((resolve, reject) => {
      this.recognizer!.startContinuousRecognitionAsync(
        () => resolve(),
        (err) => reject(new Error(String(err)))
      );
    });
  }

  // Azure SDK manages its own microphone stream, so this is a no-op
  sendAudio(_chunk: Blob) {}

  disconnect() {
    if (this.recognizer) {
      this.recognizer.stopContinuousRecognitionAsync(
        () => {},
        () => {}
      );
      this.recognizer.close();
      this.recognizer = null;
    }
  }
}
