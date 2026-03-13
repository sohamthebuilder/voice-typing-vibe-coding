import { describe, it, expect } from "vitest";
import { resolveLanguageCode, UNIFIED_LANGUAGES } from "./languages";
import type { Provider } from "./providers/types";

describe("resolveLanguageCode", () => {
  it("returns auto and multi as-is for all providers", () => {
    const providers: Provider[] = [
      "openai",
      "deepgram",
      "azure",
      "aws-transcribe",
      "assemblyai",
      "elevenlabs",
      "sarvam",
    ];
    for (const p of providers) {
      expect(resolveLanguageCode("auto", p)).toBe("auto");
      expect(resolveLanguageCode("multi", p)).toBe("multi");
    }
  });

  it("returns base code for openai and deepgram (except yue)", () => {
    expect(resolveLanguageCode("en", "openai")).toBe("en");
    expect(resolveLanguageCode("hi", "deepgram")).toBe("hi");
  });

  it("maps yue to zh-HK for openai and deepgram", () => {
    expect(resolveLanguageCode("yue", "openai")).toBe("zh-HK");
    expect(resolveLanguageCode("yue", "deepgram")).toBe("zh-HK");
  });

  it("maps to Azure locale format", () => {
    expect(resolveLanguageCode("en", "azure")).toBe("en-US");
    expect(resolveLanguageCode("hi", "azure")).toBe("hi-IN");
    expect(resolveLanguageCode("ja", "azure")).toBe("ja-JP");
  });

  it("maps to AWS Transcribe locale format", () => {
    expect(resolveLanguageCode("en", "aws-transcribe")).toBe("en-US");
    expect(resolveLanguageCode("hi", "aws-transcribe")).toBe("hi-IN");
  });

  it("returns base code for assemblyai and elevenlabs", () => {
    expect(resolveLanguageCode("en", "assemblyai")).toBe("en");
    expect(resolveLanguageCode("hi", "elevenlabs")).toBe("hi");
  });

  it("maps to Sarvam locale format", () => {
    expect(resolveLanguageCode("en", "sarvam")).toBe("en-IN");
    expect(resolveLanguageCode("hi", "sarvam")).toBe("hi-IN");
    expect(resolveLanguageCode("bn", "sarvam")).toBe("bn-IN");
  });

  it("returns base code when no mapping exists for provider", () => {
    expect(resolveLanguageCode("xx", "openai")).toBe("xx");
    expect(resolveLanguageCode("xx", "azure")).toBe("xx");
  });
});

describe("UNIFIED_LANGUAGES", () => {
  it("includes auto-detect as first option", () => {
    expect(UNIFIED_LANGUAGES[0].code).toBe("auto");
    expect(UNIFIED_LANGUAGES[0].name).toBe("Auto-detect");
  });

  it("has unique codes", () => {
    const codes = UNIFIED_LANGUAGES.map((l) => l.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it("has name for each language", () => {
    for (const lang of UNIFIED_LANGUAGES) {
      expect(lang.name).toBeTruthy();
      expect(typeof lang.name).toBe("string");
    }
  });
});
