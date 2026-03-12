"use client";

import { useState, useReducer, useCallback, useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useTranscription } from "@/hooks/useTranscription";
import { TopBar } from "@/components/TopBar";
import { ApiKeyPanel, ApiKeys } from "@/components/ApiKeyPanel";
import { ModelSelector } from "@/components/ModelSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { RecordButton } from "@/components/RecordButton";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { TranscriptionOutput } from "@/components/TranscriptionOutput";
import { SettingsPanel, Settings } from "@/components/SettingsPanel";
import { StatusBar } from "@/components/StatusBar";
import { ToastContainer, showToast } from "@/components/Toast";
import { MicPermissionPrompt } from "@/components/MicPermissionPrompt";
import { RequestBodyPanel, RequestBody } from "@/components/RequestBodyPanel";
import { ModelDef, modelSupportsLanguage, getDefaultModelParams } from "@/lib/models";
import { resolveLanguageCode } from "@/lib/languages";
import { Provider } from "@/lib/providers/types";
import { isBrowserSupported, classNames } from "@/lib/utils";

interface AppState {
  selectedModel: ModelDef | null;
  selectedLanguage: string | null;
  apiKeys: ApiKeys;
  settings: Settings;
  mobileSettingsOpen: boolean;
  showMicPrompt: boolean;
  browserSupported: boolean;
}

type Action =
  | { type: "SET_MODEL"; model: ModelDef }
  | { type: "SET_LANGUAGE"; code: string }
  | { type: "SET_KEYS"; keys: ApiKeys }
  | { type: "SET_SETTINGS"; settings: Settings }
  | { type: "TOGGLE_MOBILE_SETTINGS" }
  | { type: "SHOW_MIC_PROMPT"; show: boolean }
  | { type: "SET_BROWSER_SUPPORT"; supported: boolean };

const EMPTY_KEYS: ApiKeys = {
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

function loadKeys(): ApiKeys {
  if (typeof window === "undefined") return { ...EMPTY_KEYS };
  try {
    const stored = sessionStorage.getItem("voicedrop-keys");
    if (stored) return { ...EMPTY_KEYS, ...JSON.parse(stored) };
  } catch {}
  return { ...EMPTY_KEYS };
}

function reducer(state: AppState, action: Action): AppState {
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
}

const initialState: AppState = {
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
};

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { theme, toggle: toggleTheme } = useTheme();
  const isConnectedRef = useRef(false);
  const [lastRequestBody, setLastRequestBody] = useState<RequestBody | null>(null);

  const {
    segments,
    fullText,
    latency,
    connect,
    sendAudio,
    disconnect,
    clear: clearTranscript,
  } = useTranscription({
    onError: (err) => showToast(err.message),
  });

  const timeslice = state.selectedModel?.isStreaming ? 250 : 5000;

  const {
    isRecording,
    duration,
    audioLevel,
    permissionDenied,
    start: startRecording,
    stop: stopRecording,
  } = useAudioRecorder({
    timeslice,
    deviceId: state.settings.micDeviceId || undefined,
    onChunk: sendAudio,
  });

  useEffect(() => {
    dispatch({ type: "SET_KEYS", keys: loadKeys() });
    dispatch({ type: "SET_BROWSER_SUPPORT", supported: isBrowserSupported() });
  }, []);

  useEffect(() => {
    if (
      state.apiKeys.openai ||
      state.apiKeys.deepgram ||
      state.apiKeys.azure ||
      state.apiKeys["aws-transcribe"] ||
      state.apiKeys.assemblyai ||
      state.apiKeys.elevenlabs ||
      state.apiKeys.sarvam
    ) {
      sessionStorage.setItem("voicedrop-keys", JSON.stringify(state.apiKeys));
    }
  }, [state.apiKeys]);

  useEffect(() => {
    if (permissionDenied) {
      dispatch({ type: "SHOW_MIC_PROMPT", show: true });
    }
  }, [permissionDenied]);

  const getKeyForProvider = useCallback(
    (provider: Provider): string => state.apiKeys[provider],
    [state.apiKeys]
  );

  const getDisabledReason = useCallback((): string | undefined => {
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
  }, [state.selectedLanguage, state.selectedModel, state.apiKeys, getKeyForProvider]);

  const handleToggleRecord = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      disconnect();
      isConnectedRef.current = false;
      return;
    }

    if (!state.selectedModel || !state.selectedLanguage) {
      showToast("Select a language and model before recording");
      return;
    }

    const provider = state.selectedModel.provider;
    const key = getKeyForProvider(provider);
    if (!key) {
      showToast(`Enter your ${provider} API key first`);
      return;
    }

    const resolvedLang = resolveLanguageCode(
      state.selectedLanguage,
      provider
    );

    const region =
      provider === "azure" ? state.apiKeys.azureRegion
      : provider === "aws-transcribe" ? state.apiKeys.awsTranscribeRegion
      : undefined;

    const body: RequestBody = {
      provider,
      apiKey: key,
      secretKey: provider === "aws-transcribe" ? state.apiKeys.awsTranscribeSecret : undefined,
      region,
      model: state.selectedModel.id,
      language: resolvedLang,
      punctuate: state.settings.punctuate,
      profanityFilter: state.settings.profanityFilter,
      modelParams: state.settings.modelParams,
    };
    setLastRequestBody(body);

    try {
      await connect(body);
      isConnectedRef.current = true;

      await startRecording();
    } catch (err) {
      disconnect();
      isConnectedRef.current = false;
      if (
        err instanceof DOMException &&
        (err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError")
      ) {
        return;
      }
      showToast(
        err instanceof Error ? err.message : "Failed to start recording"
      );
    }
  }, [
    isRecording,
    state.selectedModel,
    state.selectedLanguage,
    state.apiKeys,
    state.settings,
    getKeyForProvider,
    connect,
    disconnect,
    startRecording,
    stopRecording,
  ]);

  const dark = theme === "dark";
  const disabledReason = getDisabledReason();
  const highlightProvider =
    state.selectedModel && !getKeyForProvider(state.selectedModel.provider)
      ? state.selectedModel.provider
      : null;

  return (
    <div
      className={classNames(
        "flex flex-col h-screen",
        dark ? "bg-[#09090b]" : "bg-[#fafafa]"
      )}
    >
      {!state.browserSupported && (
        <div className="bg-amber-500 text-black text-sm text-center py-2 px-4">
          Your browser may not fully support voice recording. For best results,
          use Chrome or Edge.
        </div>
      )}

      <TopBar
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => dispatch({ type: "TOGGLE_MOBILE_SETTINGS" })}
      />

      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left panel: controls */}
        <div
          className={classNames(
            "w-full md:w-[28%] md:min-w-[280px] md:max-w-[360px] p-4 md:p-6 flex flex-col gap-4 md:overflow-y-auto md:border-r",
            dark ? "md:border-[#27272a]" : "md:border-[#e4e4e7]"
          )}
        >
          {/* Language first, then model */}
          <LanguageSelector
            theme={theme}
            selectedLanguage={state.selectedLanguage}
            onSelect={(code) => dispatch({ type: "SET_LANGUAGE", code })}
            disabled={isRecording}
          />

          <ModelSelector
            theme={theme}
            selectedModelId={state.selectedModel?.id ?? null}
            selectedLanguage={state.selectedLanguage}
            onSelect={(m) => dispatch({ type: "SET_MODEL", model: m })}
            disabled={isRecording}
          />

          <div className="flex flex-col items-center py-4 md:py-6">
            <RecordButton
              theme={theme}
              isRecording={isRecording}
              duration={duration}
              onToggle={handleToggleRecord}
              disabled={!!disabledReason && !isRecording}
              disabledReason={disabledReason}
            />
            <AudioVisualizer
              theme={theme}
              audioLevel={audioLevel}
              isRecording={isRecording}
            />
          </div>
        </div>

        {/* Center panel: transcription */}
        <div className="flex-1 p-4 md:p-6 min-h-0 flex flex-col">
          <TranscriptionOutput
            theme={theme}
            segments={segments}
            fullText={fullText}
            onClear={clearTranscript}
          />
        </div>

        {/* Right panel: secondary controls */}
        <div
          className={classNames(
            "hidden md:flex md:w-[32%] md:min-w-[300px] md:max-w-[400px] md:flex-col md:gap-4 md:p-6 md:overflow-y-auto md:border-l",
            dark ? "md:border-[#27272a]" : "md:border-[#e4e4e7]"
          )}
        >
          <ApiKeyPanel
            theme={theme}
            keys={state.apiKeys}
            onKeysChange={(keys) => dispatch({ type: "SET_KEYS", keys })}
            highlightProvider={highlightProvider}
            variant="sidebar"
          />

          <SettingsPanel
            theme={theme}
            settings={state.settings}
            onSettingsChange={(s) =>
              dispatch({ type: "SET_SETTINGS", settings: s })
            }
            selectedModel={state.selectedModel}
          />

          <RequestBodyPanel theme={theme} requestBody={lastRequestBody} />
        </div>
      </div>

      <StatusBar
        theme={theme}
        fullText={fullText}
        modelId={state.selectedModel?.id ?? null}
        latency={latency}
      />

      {/* Mobile settings sheet */}
      <div className="md:hidden">
        <SettingsPanel
          theme={theme}
          settings={state.settings}
          onSettingsChange={(s) =>
            dispatch({ type: "SET_SETTINGS", settings: s })
          }
          selectedModel={state.selectedModel}
          isMobileSheet
          isOpen={state.mobileSettingsOpen}
          onClose={() => dispatch({ type: "TOGGLE_MOBILE_SETTINGS" })}
        />
        <div className="px-4 pb-4 space-y-4">
          <ApiKeyPanel
            theme={theme}
            keys={state.apiKeys}
            onKeysChange={(keys) => dispatch({ type: "SET_KEYS", keys })}
            highlightProvider={highlightProvider}
            variant="sidebar"
          />
          <RequestBodyPanel theme={theme} requestBody={lastRequestBody} />
        </div>
      </div>

      {state.showMicPrompt && (
        <MicPermissionPrompt
          theme={theme}
          onDismiss={() =>
            dispatch({ type: "SHOW_MIC_PROMPT", show: false })
          }
        />
      )}

      <ToastContainer theme={theme} />
    </div>
  );
}
