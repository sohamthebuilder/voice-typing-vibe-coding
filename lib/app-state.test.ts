import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadKeys,
  createAppReducer,
  getDisabledReason,
  EMPTY_KEYS,
  type AppState,
  type ApiKeys,
} from "./app-state";
import { modelSupportsLanguage, getDefaultModelParams, findModel } from "./models";

const reducer = createAppReducer(modelSupportsLanguage, getDefaultModelParams);

const createInitialState = (overrides: Partial<AppState> = {}): AppState => ({
  selectedModel: null,
  selectedLanguage: null,
  apiKeys: { ...EMPTY_KEYS },
  settings: {
    micDeviceId: "",
    punctuate: true,
    profanityFilter: false,
    modelParams: {},
  },
  mobileSettingsOpen: false,
  showMicPrompt: false,
  browserSupported: true,
  ...overrides,
});

describe("app-state", () => {
  describe("loadKeys", () => {
    it("returns empty keys when window is undefined", () => {
      const win = globalThis.window;
      vi.stubGlobal("window", undefined);
      try {
        const keys = loadKeys();
        expect(keys).toEqual(EMPTY_KEYS);
      } finally {
        vi.stubGlobal("window", win);
      }
    });

    it("returns parsed keys from sessionStorage", () => {
      const stored = { openai: "sk-123", deepgram: "" };
      sessionStorage.setItem("voicedrop-keys", JSON.stringify(stored));
      const keys = loadKeys();
      expect(keys.openai).toBe("sk-123");
      expect(keys).toMatchObject({ ...EMPTY_KEYS, ...stored });
    });

    it("returns empty keys when sessionStorage has invalid JSON", () => {
      sessionStorage.setItem("voicedrop-keys", "invalid json");
      const keys = loadKeys();
      expect(keys).toEqual(EMPTY_KEYS);
    });
  });

  describe("reducer", () => {
    const whisperModel = findModel("whisper-1")!;
    const nova3Model = findModel("nova-3")!;

    it("SET_LANGUAGE updates language", () => {
      const state = createInitialState({ selectedLanguage: "en" });
      const next = reducer(state, { type: "SET_LANGUAGE", code: "hi" });
      expect(next.selectedLanguage).toBe("hi");
    });

    it("SET_LANGUAGE clears model when new language not supported", () => {
      // flux-general-en is English only, doesn't support "hi"
      const fluxModel = findModel("flux-general-en")!;
      const state = createInitialState({
        selectedLanguage: "en",
        selectedModel: fluxModel,
      });
      const next = reducer(state, { type: "SET_LANGUAGE", code: "hi" });
      expect(next.selectedModel).toBeNull();
    });

    it("SET_LANGUAGE keeps model when new language supported", () => {
      const state = createInitialState({
        selectedLanguage: "en",
        selectedModel: whisperModel,
      });
      const next = reducer(state, { type: "SET_LANGUAGE", code: "ja" });
      expect(next.selectedModel).toBe(whisperModel);
    });

    it("SET_MODEL updates model and modelParams", () => {
      const state = createInitialState();
      const next = reducer(state, { type: "SET_MODEL", model: whisperModel });
      expect(next.selectedModel).toBe(whisperModel);
      expect(next.settings.modelParams).toBeDefined();
    });

    it("SET_KEYS updates apiKeys", () => {
      const state = createInitialState();
      const keys: ApiKeys = { ...EMPTY_KEYS, openai: "sk-new" };
      const next = reducer(state, { type: "SET_KEYS", keys });
      expect(next.apiKeys.openai).toBe("sk-new");
    });

    it("SET_SETTINGS updates settings", () => {
      const state = createInitialState();
      const next = reducer(state, {
        type: "SET_SETTINGS",
        settings: { ...state.settings, punctuate: false },
      });
      expect(next.settings.punctuate).toBe(false);
    });

    it("TOGGLE_MOBILE_SETTINGS toggles mobileSettingsOpen", () => {
      const state = createInitialState({ mobileSettingsOpen: false });
      const next = reducer(state, { type: "TOGGLE_MOBILE_SETTINGS" });
      expect(next.mobileSettingsOpen).toBe(true);
      const next2 = reducer(next, { type: "TOGGLE_MOBILE_SETTINGS" });
      expect(next2.mobileSettingsOpen).toBe(false);
    });

    it("SHOW_MIC_PROMPT updates showMicPrompt", () => {
      const state = createInitialState();
      const next = reducer(state, { type: "SHOW_MIC_PROMPT", show: true });
      expect(next.showMicPrompt).toBe(true);
    });

    it("SET_BROWSER_SUPPORT updates browserSupported", () => {
      const state = createInitialState();
      const next = reducer(state, { type: "SET_BROWSER_SUPPORT", supported: false });
      expect(next.browserSupported).toBe(false);
    });

    it("returns state for unknown action", () => {
      const state = createInitialState();
      const next = reducer(state, { type: "UNKNOWN" as never, payload: {} });
      expect(next).toBe(state);
    });
  });

  describe("getDisabledReason", () => {
    const getKeyForProvider = (provider: string) => {
      const keys: Record<string, string> = {
        openai: "sk-openai",
        deepgram: "dg-key",
        azure: "az-key",
        "aws-transcribe": "aws-key",
        assemblyai: "aa-key",
        elevenlabs: "el-key",
        sarvam: "sv-key",
      };
      return keys[provider] ?? "";
    };

    it("returns Select a language first when no language", () => {
      const state = createInitialState();
      const reason = getDisabledReason(state, getKeyForProvider);
      expect(reason).toBe("Select a language first");
    });

    it("returns Select a model when no model", () => {
      const state = createInitialState({ selectedLanguage: "en" });
      const reason = getDisabledReason(state, getKeyForProvider);
      expect(reason).toBe("Select a model");
    });

    it("returns API key message when key missing for provider", () => {
      const state = createInitialState({
        selectedLanguage: "en",
        selectedModel: findModel("whisper-1")!,
      });
      const reason = getDisabledReason(state, () => "");
      expect(reason).toContain("OpenAI API key");
    });

    it("returns Azure region message when Azure selected but no region", () => {
      const state = createInitialState({
        selectedLanguage: "en",
        selectedModel: findModel("azure-stt-latest")!,
        apiKeys: { ...EMPTY_KEYS, azure: "key" },
      });
      const reason = getDisabledReason(state, (p) => (p === "azure" ? "key" : ""));
      expect(reason).toBe("Enter your Azure region");
    });

    it("returns AWS secret message when AWS selected but no secret", () => {
      const state = createInitialState({
        selectedLanguage: "en",
        selectedModel: findModel("aws-transcribe-general")!,
        apiKeys: {
          ...EMPTY_KEYS,
          "aws-transcribe": "key",
          awsTranscribeRegion: "us-east-1",
        },
      });
      const reason = getDisabledReason(state, (p) => {
        if (p === "aws-transcribe") return "key";
        return "";
      });
      expect(reason).toBe("Enter your AWS Secret Access Key");
    });

    it("returns undefined when all requirements met", () => {
      const state = createInitialState({
        selectedLanguage: "en",
        selectedModel: findModel("whisper-1")!,
        apiKeys: { ...EMPTY_KEYS, openai: "sk-123" },
      });
      const reason = getDisabledReason(state, getKeyForProvider);
      expect(reason).toBeUndefined();
    });
  });
});
