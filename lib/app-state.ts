import type { ModelDef } from "./models";
import type { Provider } from "./providers/types";

export interface ApiKeys {
  openai: string;
  deepgram: string;
  azure: string;
  azureRegion: string;
  "aws-transcribe": string;
  awsTranscribeSecret: string;
  awsTranscribeRegion: string;
  assemblyai: string;
  elevenlabs: string;
  sarvam: string;
}

export interface Settings {
  micDeviceId: string;
  punctuate: boolean;
  profanityFilter: boolean;
  modelParams: Record<string, unknown>;
}

export interface AppState {
  selectedModel: ModelDef | null;
  selectedLanguage: string | null;
  apiKeys: ApiKeys;
  settings: Settings;
  mobileSettingsOpen: boolean;
  showMicPrompt: boolean;
  browserSupported: boolean;
}

export type Action =
  | { type: "SET_MODEL"; model: ModelDef }
  | { type: "SET_LANGUAGE"; code: string }
  | { type: "SET_KEYS"; keys: ApiKeys }
  | { type: "SET_SETTINGS"; settings: Settings }
  | { type: "TOGGLE_MOBILE_SETTINGS" }
  | { type: "SHOW_MIC_PROMPT"; show: boolean }
  | { type: "SET_BROWSER_SUPPORT"; supported: boolean };

export const EMPTY_KEYS: ApiKeys = {
  openai: "",
  deepgram: "",
  azure: "",
  azureRegion: "",
  "aws-transcribe": "",
  awsTranscribeSecret: "",
  awsTranscribeRegion: "",
  assemblyai: "",
  elevenlabs: "",
  sarvam: "",
};

export function loadKeys(): ApiKeys {
  if (typeof window === "undefined") return { ...EMPTY_KEYS };
  try {
    const stored = sessionStorage.getItem("voicedrop-keys");
    if (stored) return { ...EMPTY_KEYS, ...JSON.parse(stored) };
  } catch {}
  return { ...EMPTY_KEYS };
}

export function createAppReducer(
  modelSupportsLanguage: (modelId: string, langId: string) => boolean,
  getDefaultModelParams: (provider: Provider) => Record<string, unknown>
) {
  return function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
      case "SET_LANGUAGE": {
        const newLang = action.code;
        const modelStillValid =
          state.selectedModel &&
          modelSupportsLanguage(state.selectedModel.id, newLang);
        return {
          ...state,
          selectedLanguage: newLang,
          selectedModel: modelStillValid ? state.selectedModel : null,
        };
      }
      case "SET_MODEL":
        return {
          ...state,
          selectedModel: action.model,
          settings: {
            ...state.settings,
            modelParams: getDefaultModelParams(action.model.provider),
          },
        };
      case "SET_KEYS":
        return { ...state, apiKeys: action.keys };
      case "SET_SETTINGS":
        return { ...state, settings: action.settings };
      case "TOGGLE_MOBILE_SETTINGS":
        return { ...state, mobileSettingsOpen: !state.mobileSettingsOpen };
      case "SHOW_MIC_PROMPT":
        return { ...state, showMicPrompt: action.show };
      case "SET_BROWSER_SUPPORT":
        return { ...state, browserSupported: action.supported };
      default:
        return state;
    }
  };
}

export function getDisabledReason(
  state: { selectedLanguage: string | null; selectedModel: ModelDef | null; apiKeys: ApiKeys },
  getKeyForProvider: (provider: Provider) => string
): string | undefined {
  if (!state.selectedLanguage) return "Select a language first";
  if (!state.selectedModel) return "Select a model";
  const provider = state.selectedModel.provider;
  const key = getKeyForProvider(provider);
  if (!key) {
    const label =
      provider === "openai" ? "OpenAI"
      : provider === "deepgram" ? "Deepgram"
      : provider === "azure" ? "Azure"
      : provider === "assemblyai" ? "AssemblyAI"
      : provider === "elevenlabs" ? "ElevenLabs"
      : provider === "sarvam" ? "Sarvam"
      : "AWS";
    return `Enter your ${label} API key`;
  }
  if (provider === "azure" && !state.apiKeys.azureRegion)
    return "Enter your Azure region";
  if (provider === "aws-transcribe" && !state.apiKeys.awsTranscribeSecret)
    return "Enter your AWS Secret Access Key";
  if (provider === "aws-transcribe" && !state.apiKeys.awsTranscribeRegion)
    return "Enter your AWS region";
  return undefined;
}
