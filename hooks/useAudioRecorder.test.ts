import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAudioRecorder } from "./useAudioRecorder";

describe("useAudioRecorder", () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>;
  let mockTrackStop: ReturnType<typeof vi.fn>;
  let mockMediaRecorder: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    state: string;
    ondataavailable: ((e: { data: Blob }) => void) | null;
  };
  let mockStream: { getTracks: () => { stop: ReturnType<typeof vi.fn> }[] };

  beforeEach(() => {
    mockTrackStop = vi.fn();
    mockMediaRecorder = {
      start: vi.fn(),
      stop: vi.fn(),
      state: "inactive",
      ondataavailable: null,
    };
    mockStream = {
      getTracks: () => [{ stop: mockTrackStop }],
    };
    mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: mockGetUserMedia,
      },
    });
    const MockMediaRecorder = vi.fn().mockImplementation(function (this: unknown) {
      return mockMediaRecorder;
    });
    (MockMediaRecorder as unknown as { isTypeSupported: () => boolean }).isTypeSupported = vi.fn().mockReturnValue(true);
    vi.stubGlobal("MediaRecorder", MockMediaRecorder);
    vi.stubGlobal("AudioContext", vi.fn().mockImplementation(function (this: unknown) {
      return {
        createMediaStreamSource: vi.fn().mockReturnValue({
          connect: vi.fn(),
        }),
        createAnalyser: vi.fn().mockReturnValue({
          fftSize: 256,
          frequencyBinCount: 128,
          getByteFrequencyData: vi.fn(),
          connect: vi.fn(),
        }),
        close: vi.fn().mockResolvedValue(undefined),
        state: "running",
      };
    }));
    // Run only first callback to avoid infinite loop from startVisualizer's requestAnimationFrame loop
    let rafCount = 0;
    vi.stubGlobal("requestAnimationFrame", vi.fn((cb: () => void) => {
      if (rafCount++ < 1) cb();
      return 1;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useAudioRecorder());
    expect(result.current.isRecording).toBe(false);
    expect(result.current.duration).toBe(0);
    expect(result.current.audioLevel).toBe(0);
    expect(result.current.permissionDenied).toBe(false);
  });

  it("start calls getUserMedia and starts recording", async () => {
    mockMediaRecorder.state = "recording";
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      await result.current.start();
    });
    expect(mockGetUserMedia).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(true);
  });

  it("stop stops recording and clears state", async () => {
    mockMediaRecorder.state = "recording";
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      await result.current.start();
    });
    act(() => {
      result.current.stop();
    });
    expect(result.current.isRecording).toBe(false);
    expect(mockTrackStop).toHaveBeenCalled();
  });

  it("sets permissionDenied on NotAllowedError", async () => {
    mockGetUserMedia.mockRejectedValue(
      new DOMException("Permission denied", "NotAllowedError")
    );
    const { result } = renderHook(() => useAudioRecorder());
    await act(async () => {
      try {
        await result.current.start();
      } catch {
        // Expected to throw
      }
    });
    await waitFor(() => {
      expect(result.current.permissionDenied).toBe(true);
    });
  });

  it("calls onChunk when data is available", async () => {
    const onChunk = vi.fn();
    mockMediaRecorder.state = "recording";
    const { result } = renderHook(() =>
      useAudioRecorder({ timeslice: 250, onChunk })
    );
    await act(async () => {
      await result.current.start();
    });
    const blob = new Blob(["audio"], { type: "audio/webm" });
    mockMediaRecorder.ondataavailable?.({ data: blob });
    expect(onChunk).toHaveBeenCalledWith(blob);
  });
});
