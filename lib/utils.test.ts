import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatDuration,
  countWords,
  classNames,
  isBrowserSupported,
} from "./utils";

describe("formatDuration", () => {
  it("formats zero seconds as 00:00", () => {
    expect(formatDuration(0)).toBe("00:00");
  });

  it("formats seconds under 60", () => {
    expect(formatDuration(30)).toBe("00:30");
    expect(formatDuration(59)).toBe("00:59");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(65)).toBe("01:05");
    expect(formatDuration(125)).toBe("02:05");
    expect(formatDuration(3661)).toBe("61:01");
  });

  it("pads single digits with leading zeros", () => {
    expect(formatDuration(5)).toBe("00:05");
    expect(formatDuration(600)).toBe("10:00");
  });
});

describe("countWords", () => {
  it("returns 0 for empty string", () => {
    expect(countWords("")).toBe(0);
  });

  it("returns 0 for whitespace-only string", () => {
    expect(countWords("   ")).toBe(0);
    expect(countWords("\t\n")).toBe(0);
  });

  it("counts single word", () => {
    expect(countWords("hello")).toBe(1);
    expect(countWords("  hello  ")).toBe(1);
  });

  it("counts multiple words", () => {
    expect(countWords("hello world")).toBe(2);
    expect(countWords("one two three four")).toBe(4);
  });

  it("handles multiple spaces between words", () => {
    expect(countWords("hello    world")).toBe(2);
    expect(countWords("  a   b   c  ")).toBe(3);
  });
});

describe("classNames", () => {
  it("joins truthy strings", () => {
    expect(classNames("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(classNames("a", false, "b", undefined, "c", null)).toBe("a b c");
  });

  it("returns empty string when all falsy", () => {
    expect(classNames(false, undefined, null)).toBe("");
  });

  it("returns empty string for no args", () => {
    expect(classNames()).toBe("");
  });
});

describe("isBrowserSupported", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.stubGlobal("window", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when window is undefined (SSR)", () => {
    expect(isBrowserSupported()).toBe(true);
  });

  it("returns false when getUserMedia is missing", () => {
    vi.stubGlobal("window", {
      MediaRecorder: function () {},
      AudioContext: function () {},
      navigator: {},
    });
    expect(isBrowserSupported()).toBe(false);
  });

  it("returns false when MediaRecorder is missing", () => {
    vi.stubGlobal("window", {
      MediaRecorder: undefined,
      AudioContext: function () {},
      navigator: { mediaDevices: { getUserMedia: () => {} } },
    });
    expect(isBrowserSupported()).toBe(false);
  });

  it("returns false when AudioContext is missing", () => {
    vi.stubGlobal("window", {
      MediaRecorder: function () {},
      AudioContext: undefined,
      navigator: { mediaDevices: { getUserMedia: () => {} } },
    });
    expect(isBrowserSupported()).toBe(false);
  });

  it("returns true when all APIs are present", () => {
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: function () {} },
    });
    vi.stubGlobal("window", {
      MediaRecorder: function MediaRecorder() {},
      AudioContext: function AudioContext() {},
    });
    expect(isBrowserSupported()).toBe(true);
  });
});
