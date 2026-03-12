import { Provider } from "./providers/types";

export interface ModelDef {
  id: string;
  name: string;
  provider: Provider;
  isStreaming: boolean;
}

// ---------------------------------------------------------------------------
// Model-specific configurable parameters
// ---------------------------------------------------------------------------

export type ParamType = "boolean" | "number" | "select" | "string";

export interface ModelParamDef {
  key: string;
  label: string;
  description: string;
  type: ParamType;
  default: unknown;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

const DEEPGRAM_PARAMS: ModelParamDef[] = [
  {
    key: "smart_format",
    label: "Smart Format",
    description: "Auto-format numbers, dates, currency, and more",
    type: "boolean",
    default: true,
  },
  {
    key: "diarize",
    label: "Speaker Diarization",
    description: "Identify and label different speakers",
    type: "boolean",
    default: false,
  },
  {
    key: "filler_words",
    label: "Filler Words",
    description: "Include um, uh, and other filler words",
    type: "boolean",
    default: false,
  },
  {
    key: "endpointing",
    label: "Endpointing (ms)",
    description: "Silence duration (ms) before finalizing speech",
    type: "number",
    default: 10,
    min: 10,
    max: 5000,
    step: 10,
  },
  {
    key: "keywords",
    label: "Keywords",
    description: "Comma-separated terms to boost recognition",
    type: "string",
    default: "",
    placeholder: "e.g. Kubernetes, gRPC, OAuth",
  },
];

const OPENAI_PARAMS: ModelParamDef[] = [
  {
    key: "prompt",
    label: "Prompt",
    description: "Guide style, vocabulary, or context for transcription",
    type: "string",
    default: "",
    placeholder: "e.g. This is a technical podcast about AI...",
  },
  {
    key: "temperature",
    label: "Temperature",
    description: "Sampling randomness (0 = deterministic, 1 = creative)",
    type: "number",
    default: 0,
    min: 0,
    max: 1,
    step: 0.1,
  },
];

const AWS_TRANSCRIBE_PARAMS: ModelParamDef[] = [
  {
    key: "partialResultsStability",
    label: "Partial Results Stability",
    description: "Trade-off between speed and accuracy of interim results",
    type: "select",
    default: "medium",
    options: [
      { value: "low", label: "Low (faster, less stable)" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High (slower, more stable)" },
    ],
  },
  {
    key: "showSpeakerLabel",
    label: "Speaker Labels",
    description: "Identify and label different speakers",
    type: "boolean",
    default: false,
  },
  {
    key: "vocabularyName",
    label: "Custom Vocabulary",
    description: "Name of a custom vocabulary created in AWS",
    type: "string",
    default: "",
    placeholder: "e.g. my-medical-vocab",
  },
];

const ASSEMBLYAI_PARAMS: ModelParamDef[] = [
  {
    key: "word_boost",
    label: "Word Boost",
    description: "Comma-separated words/phrases to boost recognition",
    type: "string",
    default: "",
    placeholder: "e.g. AssemblyAI, LLM, transformer",
  },
];

const ELEVENLABS_PARAMS: ModelParamDef[] = [];

const SARVAM_PARAMS: ModelParamDef[] = [
  {
    key: "mode",
    label: "Mode",
    description: "Output mode for transcription (saaras:v3 only)",
    type: "select",
    default: "transcribe",
    options: [
      { value: "transcribe", label: "Transcribe (native script)" },
      { value: "translate", label: "Translate (to English)" },
      { value: "verbatim", label: "Verbatim (no normalization)" },
      { value: "translit", label: "Transliterate (Roman script)" },
      { value: "codemix", label: "Code-mix (English + native)" },
    ],
  },
  {
    key: "high_vad_sensitivity",
    label: "High VAD Sensitivity",
    description: "Enable high Voice Activity Detection sensitivity",
    type: "boolean",
    default: false,
  },
];

const PROVIDER_PARAMS: Partial<Record<Provider, ModelParamDef[]>> = {
  deepgram: DEEPGRAM_PARAMS,
  openai: OPENAI_PARAMS,
  "aws-transcribe": AWS_TRANSCRIBE_PARAMS,
  assemblyai: ASSEMBLYAI_PARAMS,
  elevenlabs: ELEVENLABS_PARAMS,
  sarvam: SARVAM_PARAMS,
};

export function getModelParams(provider: Provider): ModelParamDef[] {
  return PROVIDER_PARAMS[provider] ?? [];
}

export function getDefaultModelParams(provider: Provider): Record<string, unknown> {
  const defs = getModelParams(provider);
  const defaults: Record<string, unknown> = {};
  for (const p of defs) {
    defaults[p.key] = p.default;
  }
  return defaults;
}

export const PROVIDER_META: Record<
  Provider,
  { label: string; color: string; bgClass: string; textClass: string }
> = {
  openai: {
    label: "OpenAI",
    color: "#8b5cf6",
    bgClass: "bg-[#8b5cf6]/15",
    textClass: "text-[#8b5cf6]",
  },
  deepgram: {
    label: "Deepgram",
    color: "#13ef93",
    bgClass: "bg-[#13ef93]/15",
    textClass: "text-[#13ef93]",
  },
  azure: {
    label: "Azure",
    color: "#00bcf2",
    bgClass: "bg-[#00bcf2]/15",
    textClass: "text-[#00bcf2]",
  },
  "aws-transcribe": {
    label: "AWS Transcribe",
    color: "#ff9900",
    bgClass: "bg-[#ff9900]/15",
    textClass: "text-[#ff9900]",
  },
  assemblyai: {
    label: "AssemblyAI",
    color: "#f55b5b",
    bgClass: "bg-[#f55b5b]/15",
    textClass: "text-[#f55b5b]",
  },
  elevenlabs: {
    label: "ElevenLabs",
    color: "#5d5dff",
    bgClass: "bg-[#5d5dff]/15",
    textClass: "text-[#5d5dff]",
  },
  sarvam: {
    label: "Sarvam",
    color: "#e85d04",
    bgClass: "bg-[#e85d04]/15",
    textClass: "text-[#e85d04]",
  },
};

export const ALL_MODELS: ModelDef[] = [
  // OpenAI
  { id: "whisper-1", name: "Whisper-1", provider: "openai", isStreaming: false },

  // Deepgram (https://developers.deepgram.com/docs/models-languages-overview)
  { id: "flux-general-en", name: "Flux (English)", provider: "deepgram", isStreaming: true },
  { id: "nova-3", name: "Nova-3", provider: "deepgram", isStreaming: true },
  { id: "nova-3-medical", name: "Nova-3 Medical", provider: "deepgram", isStreaming: true },
  { id: "nova-2", name: "Nova-2", provider: "deepgram", isStreaming: true },
  { id: "nova-2-medical", name: "Nova-2 Medical", provider: "deepgram", isStreaming: true },
  { id: "nova-2-meeting", name: "Nova-2 Meeting", provider: "deepgram", isStreaming: true },
  { id: "nova-2-phonecall", name: "Nova-2 Phonecall", provider: "deepgram", isStreaming: true },
  { id: "nova-2-finance", name: "Nova-2 Finance", provider: "deepgram", isStreaming: true },
  { id: "nova-2-conversationalai", name: "Nova-2 Conversational AI", provider: "deepgram", isStreaming: true },
  { id: "nova-2-voicemail", name: "Nova-2 Voicemail", provider: "deepgram", isStreaming: true },
  { id: "nova-2-video", name: "Nova-2 Video", provider: "deepgram", isStreaming: true },
  { id: "nova-2-automotive", name: "Nova-2 Automotive", provider: "deepgram", isStreaming: true },
  { id: "enhanced", name: "Enhanced", provider: "deepgram", isStreaming: true },
  { id: "base", name: "Base", provider: "deepgram", isStreaming: true },

  // Azure
  { id: "azure-stt-latest", name: "Latest (Unified)", provider: "azure", isStreaming: true },
  { id: "azure-stt-conversation", name: "Conversation", provider: "azure", isStreaming: true },
  { id: "azure-stt-interactive", name: "Interactive", provider: "azure", isStreaming: true },
  { id: "azure-stt-dictation", name: "Dictation", provider: "azure", isStreaming: true },

  // AWS Transcribe (https://docs.aws.amazon.com/transcribe/latest/dg/streaming.html)
  { id: "aws-transcribe-general", name: "General", provider: "aws-transcribe", isStreaming: true },
  { id: "aws-transcribe-medical", name: "Medical (English)", provider: "aws-transcribe", isStreaming: true },

  // AssemblyAI (https://www.assemblyai.com/docs/getting-started/transcribe-streaming-audio)
  { id: "u3-rt-pro", name: "Universal-3 RT Pro", provider: "assemblyai", isStreaming: true },
  { id: "universal-streaming-english", name: "Universal Streaming (English)", provider: "assemblyai", isStreaming: true },
  { id: "universal-streaming-multilingual", name: "Universal Streaming (Multilingual)", provider: "assemblyai", isStreaming: true },
  { id: "whisper-rt", name: "Whisper RT", provider: "assemblyai", isStreaming: true },

  // ElevenLabs (https://elevenlabs.io/docs/overview/capabilities/speech-to-text)
  { id: "scribe_v2_realtime", name: "Scribe v2 Realtime", provider: "elevenlabs", isStreaming: true },

  // Sarvam (https://docs.sarvam.ai/api-reference-docs/speech-to-text/transcribe/ws)
  { id: "saaras:v3", name: "Saaras v3", provider: "sarvam", isStreaming: true },
  { id: "saarika:v2.5", name: "Saarika v2.5 (Legacy)", provider: "sarvam", isStreaming: true },
];

// ---------------------------------------------------------------------------
// Per-model language support (base language codes from UNIFIED_LANGUAGES)
// Source: https://developers.deepgram.com/docs/models-languages-overview
// ---------------------------------------------------------------------------

const ENGLISH_ONLY = ["en"];

const WHISPER_LANGS = [
  "af","ar","hy","az","be","bs","bg","ca","zh","hr","cs","da","nl","en","et",
  "fi","fr","gl","de","el","he","hi","hu","is","id","it","ja","kn","kk","ko",
  "lv","lt","mk","ms","mr","mi","ne","no","fa","pl","pt","ro","ru","sk","sl",
  "sr","es","sw","sv","tl","ta","th","tr","uk","ur","vi","cy",
];

const NOVA3_LANGS = [
  "multi","ar","be","bn","bs","bg","ca","hr","cs","da","nl","en","et","fi",
  "fr","de","el","he","hi","hu","id","it","ja","kn","ko","lv","lt","mk","ms",
  "mr","no","fa","pl","pt","ro","ru","sr","sk","sl","es","sv","tl","ta","te",
  "tr","uk","ur","vi",
];

const NOVA2_LANGS = [
  "multi","bg","ca","zh","yue","cs","da","nl","en","et","fi","fr","de","el",
  "hi","hu","id","it","ja","ko","lv","lt","ms","no","pl","pt","ro","ru","sk",
  "es","sv","th","tr","uk","vi",
];

const ENHANCED_LANGS = [
  "da","nl","en","fr","de","hi","it","ja","ko","no","pl","pt","es","sv","taq","ta",
];

const BASE_LANGS = [
  "zh","da","nl","en","fr","de","hi","id","it","ja","ko","no","pl","pt","ru",
  "es","sv","taq","tr","uk",
];

const AZURE_LANGS = [
  "af","am","ar","az","bg","bn","bs","ca","cs","cy","da","de","el","en","es",
  "et","eu","fa","fi","fil","fr","ga","gl","gu","he","hi","hr","hu","hy","id",
  "is","it","ja","jv","ka","kk","km","kn","ko","lo","lt","lv","mk","ml","mn",
  "mr","ms","my","no","ne","nl","pl","pt","ro","ru","si","sk","sl","sq","sr",
  "sv","sw","ta","te","th","tr","uk","ur","vi","zh","yue","zu",
];

const AWS_TRANSCRIBE_LANGS = [
  "af","ar","zh","da","nl","en","fr","de","he","hi","id","it","ja","ko",
  "ms","pt","ru","es","sv","ta","te","th","tr","vi",
];

const ASSEMBLYAI_MULTILINGUAL_LANGS = [
  "en","es","fr","de","it","pt","nl","zh","ja","ko","ru","pl","tr","uk",
  "vi","hi","bn","th","id","ms","ta","ar","he","cs","da","fi","el","hu",
  "no","ro","sv","hr","bg","sk","sl","lt","lv","et","sr",
];

const ASSEMBLYAI_WHISPER_RT_LANGS = [
  "af","ar","hy","az","be","bs","bg","ca","zh","hr","cs","da","nl","en","et",
  "fi","fr","gl","de","el","he","hi","hu","is","id","it","ja","kn","kk","ko",
  "lv","lt","mk","ms","mr","mi","ne","no","fa","pl","pt","ro","ru","sk","sl",
  "sr","es","sw","sv","tl","ta","th","tr","uk","ur","vi","cy",
];

const ELEVENLABS_SCRIBE_LANGS = [
  "af","am","ar","hy","az","be","bn","bs","bg","my","yue","ca","hr","cs","da",
  "nl","en","et","fil","fi","fr","gl","ka","de","el","gu","he","hi","hu","is",
  "id","ga","it","ja","jv","kn","kk","km","ko","lo","lv","lt","mk","ms","ml",
  "mi","mr","mn","ne","no","fa","pl","pt","ro","ru","sr","sk","sl","es","sw",
  "sv","ta","te","th","tr","uk","ur","vi","cy","zu","zh",
];

const SARVAM_V3_LANGS = [
  "en","hi","bn","gu","kn","ml","mr","od","pa","ta","te",
  "as","ur","ne","kok","ks","sd","sa","sat","mni","brx","mai","doi",
];

const SARVAM_V2_5_LANGS = [
  "en","hi","bn","gu","kn","ml","mr","od","pa","ta","te",
];

const MODEL_LANGUAGES: Record<string, string[]> = {
  "whisper-1": WHISPER_LANGS,

  "flux-general-en": ENGLISH_ONLY,
  "nova-3": NOVA3_LANGS,
  "nova-3-medical": ENGLISH_ONLY,
  "nova-2": NOVA2_LANGS,
  "nova-2-medical": ENGLISH_ONLY,
  "nova-2-meeting": ENGLISH_ONLY,
  "nova-2-phonecall": ENGLISH_ONLY,
  "nova-2-finance": ENGLISH_ONLY,
  "nova-2-conversationalai": ENGLISH_ONLY,
  "nova-2-voicemail": ENGLISH_ONLY,
  "nova-2-video": ENGLISH_ONLY,
  "nova-2-automotive": ENGLISH_ONLY,
  "enhanced": ENHANCED_LANGS,
  "base": BASE_LANGS,

  "azure-stt-latest": AZURE_LANGS,
  "azure-stt-conversation": AZURE_LANGS,
  "azure-stt-interactive": AZURE_LANGS,
  "azure-stt-dictation": AZURE_LANGS,

  "aws-transcribe-general": AWS_TRANSCRIBE_LANGS,
  "aws-transcribe-medical": ENGLISH_ONLY,

  "u3-rt-pro": ASSEMBLYAI_MULTILINGUAL_LANGS,
  "universal-streaming-english": ENGLISH_ONLY,
  "universal-streaming-multilingual": ASSEMBLYAI_MULTILINGUAL_LANGS,
  "whisper-rt": ASSEMBLYAI_WHISPER_RT_LANGS,

  "scribe_v2_realtime": ELEVENLABS_SCRIBE_LANGS,

  "saaras:v3": SARVAM_V3_LANGS,
  "saarika:v2.5": SARVAM_V2_5_LANGS,
};

/**
 * Returns models that support the given language (base code).
 * "auto" returns all models (every model supports auto-detect).
 */
export function getModelsForLanguage(langId: string | null): ModelDef[] {
  if (!langId) return [];
  if (langId === "auto") return ALL_MODELS;
  return ALL_MODELS.filter((m) => {
    const supported = MODEL_LANGUAGES[m.id];
    return supported?.includes(langId) ?? false;
  });
}

export function modelSupportsLanguage(modelId: string, langId: string): boolean {
  if (langId === "auto") return true;
  const supported = MODEL_LANGUAGES[modelId];
  return supported?.includes(langId) ?? false;
}

export function getModelsByProvider(): Record<Provider, ModelDef[]> {
  const grouped: Record<Provider, ModelDef[]> = {
    openai: [],
    deepgram: [],
    azure: [],
    "aws-transcribe": [],
    assemblyai: [],
    elevenlabs: [],
    sarvam: [],
  };
  for (const m of ALL_MODELS) {
    grouped[m.provider].push(m);
  }
  return grouped;
}

export function findModel(id: string): ModelDef | undefined {
  return ALL_MODELS.find((m) => m.id === id);
}
