import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTranscription } from "./useTranscription";

// Mock all providers
const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockSendAudio = vi.fn();
const mockDisconnect = vi.fn();
const mockOnError = vi.fn();

vi.mock("@/lib/providers/deepgram", () => ({
  DeepgramProvider: vi.fn().mockImplementation(function (this: unknown) {
    return {
      connect: mockConnect,
      sendAudio: mockSendAudio,
      disconnect: mockDisconnect,
      onTranscript: vi.fn(),
      onError: mockOnError,
      isStreaming: true,
    };
  }),
}));

vi.mock("@/lib/providers/azure", () => ({
  AzureProvider: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    sendAudio: vi.fn(),
    disconnect: vi.fn(),
    onTranscript: vi.fn(),
    onError: vi.fn(),
    isStreaming: true,
  })),
}));

vi.mock("@/lib/providers/openai", () => ({
  OpenAIProvider: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    sendAudio: vi.fn(),
    disconnect: vi.fn(),
    onTranscript: vi.fn(),
    onError: vi.fn(),
    isStreaming: false,
  })),
}));

vi.mock("@/lib/providers/aws-transcribe", () => ({
  AwsTranscribeProvider: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    sendAudio: vi.fn(),
    disconnect: vi.fn(),
    onTranscript: vi.fn(),
    onError: vi.fn(),
    isStreaming: true,
  })),
}));

vi.mock("@/lib/providers/assemblyai", () => ({
  AssemblyAIProvider: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    sendAudio: vi.fn(),
    disconnect: vi.fn(),
    onTranscript: vi.fn(),
    onError: vi.fn(),
    isStreaming: true,
  })),
}));

vi.mock("@/lib/providers/elevenlabs", () => ({
  ElevenLabsProvider: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    sendAudio: vi.fn(),
    disconnect: vi.fn(),
    onTranscript: vi.fn(),
    onError: vi.fn(),
    isStreaming: true,
  })),
}));

vi.mock("@/lib/providers/sarvam", () => ({
  SarvamProvider: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    sendAudio: vi.fn(),
    disconnect: vi.fn(),
    onTranscript: vi.fn(),
    onError: vi.fn(),
    isStreaming: true,
  })),
}));

describe("useTranscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns initial empty state", () => {
    const { result } = renderHook(() => useTranscription());
    expect(result.current.segments).toEqual([]);
    expect(result.current.fullText).toBe("");
    expect(result.current.latency).toBeNull();
  });

  it("connect creates provider and connects", async () => {
    const { result } = renderHook(() => useTranscription());
    await act(async () => {
      await result.current.connect({
        provider: "deepgram",
        apiKey: "test-key",
        model: "nova-3",
        language: "en",
        punctuate: true,
        profanityFilter: false,
      });
    });
    const { DeepgramProvider } = await import("@/lib/providers/deepgram");
    expect(DeepgramProvider).toHaveBeenCalled();
    expect(mockConnect).toHaveBeenCalled();
  });

  it("sendAudio forwards to provider after connect", async () => {
    const { result } = renderHook(() => useTranscription());
    await act(async () => {
      await result.current.connect({
        provider: "deepgram",
        apiKey: "test-key",
        model: "nova-3",
        language: "en",
        punctuate: true,
        profanityFilter: false,
      });
    });
    const blob = new Blob(["audio"], { type: "audio/webm" });
    act(() => {
      result.current.sendAudio(blob);
    });
    expect(mockSendAudio).toHaveBeenCalledWith(blob);
  });

  it("disconnect clears provider", async () => {
    const { result } = renderHook(() => useTranscription());
    await act(async () => {
      await result.current.connect({
        provider: "deepgram",
        apiKey: "test-key",
        model: "nova-3",
        language: "en",
        punctuate: true,
        profanityFilter: false,
      });
    });
    act(() => {
      result.current.sendAudio(new Blob());
    });
    expect(mockSendAudio).toHaveBeenCalledTimes(1);
    act(() => {
      result.current.disconnect();
    });
    act(() => {
      result.current.sendAudio(new Blob());
    });
    // After disconnect, provider is null so sendAudio should not forward
    expect(mockSendAudio).toHaveBeenCalledTimes(1);
  });

  it("clear resets segments and latency", async () => {
    const { result } = renderHook(() => useTranscription());
    await act(async () => {
      await result.current.connect({
        provider: "deepgram",
        apiKey: "test-key",
        model: "nova-3",
        language: "en",
        punctuate: true,
        profanityFilter: false,
      });
    });
    act(() => {
      result.current.clear();
    });
    expect(result.current.segments).toEqual([]);
    expect(result.current.latency).toBeNull();
  });

});
