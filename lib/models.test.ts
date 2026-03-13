import { describe, it, expect } from "vitest";
import {
  getModelParams,
  getDefaultModelParams,
  getModelsForLanguage,
  modelSupportsLanguage,
  getModelsByProvider,
  findModel,
  PROVIDER_META,
  ALL_MODELS,
} from "./models";
import type { Provider } from "./providers/types";

describe("getModelParams", () => {
  it("returns params for deepgram", () => {
    const params = getModelParams("deepgram");
    expect(params.length).toBeGreaterThan(0);
    expect(params.some((p) => p.key === "smart_format")).toBe(true);
    expect(params.some((p) => p.key === "diarize")).toBe(true);
  });

  it("returns params for openai", () => {
    const params = getModelParams("openai");
    expect(params.some((p) => p.key === "prompt")).toBe(true);
    expect(params.some((p) => p.key === "temperature")).toBe(true);
  });

  it("returns params for aws-transcribe", () => {
    const params = getModelParams("aws-transcribe");
    expect(params.some((p) => p.key === "partialResultsStability")).toBe(true);
  });

  it("returns params for sarvam", () => {
    const params = getModelParams("sarvam");
    expect(params.some((p) => p.key === "mode")).toBe(true);
  });

  it("returns empty array for providers with no params", () => {
    expect(getModelParams("elevenlabs")).toEqual([]);
  });

  it("returns empty array for unknown provider", () => {
    expect(getModelParams("unknown" as Provider)).toEqual([]);
  });
});

describe("getDefaultModelParams", () => {
  it("builds defaults from param definitions", () => {
    const defaults = getDefaultModelParams("deepgram");
    expect(defaults.smart_format).toBe(true);
    expect(defaults.diarize).toBe(false);
    expect(defaults.endpointing).toBe(10);
  });

  it("returns empty object for provider with no params", () => {
    expect(getDefaultModelParams("elevenlabs")).toEqual({});
  });
});

describe("getModelsForLanguage", () => {
  it("returns empty array for null language", () => {
    expect(getModelsForLanguage(null)).toEqual([]);
  });

  it("returns all models for auto", () => {
    const models = getModelsForLanguage("auto");
    expect(models.length).toBe(ALL_MODELS.length);
  });

  it("returns only English-supporting models for en", () => {
    const models = getModelsForLanguage("en");
    expect(models.length).toBeGreaterThan(0);
    expect(models.every((m) => modelSupportsLanguage(m.id, "en"))).toBe(true);
  });

  it("returns models that support Hindi for hi", () => {
    const models = getModelsForLanguage("hi");
    expect(models.length).toBeGreaterThan(0);
    expect(models.some((m) => m.provider === "sarvam")).toBe(true);
  });
});

describe("modelSupportsLanguage", () => {
  it("returns true for auto (all models support auto-detect)", () => {
    expect(modelSupportsLanguage("whisper-1", "auto")).toBe(true);
    expect(modelSupportsLanguage("nova-3", "auto")).toBe(true);
  });

  it("returns true when model supports the language", () => {
    expect(modelSupportsLanguage("whisper-1", "en")).toBe(true);
    expect(modelSupportsLanguage("nova-3", "en")).toBe(true);
    expect(modelSupportsLanguage("saaras:v3", "hi")).toBe(true);
  });

  it("returns false when model does not support the language", () => {
    expect(modelSupportsLanguage("flux-general-en", "hi")).toBe(false);
    expect(modelSupportsLanguage("nova-3-medical", "ja")).toBe(false);
  });

  it("returns false for unknown model", () => {
    expect(modelSupportsLanguage("unknown-model", "en")).toBe(false);
  });
});

describe("getModelsByProvider", () => {
  it("groups all models by provider", () => {
    const grouped = getModelsByProvider();
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
      expect(Array.isArray(grouped[p])).toBe(true);
    }
    const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
    expect(total).toBe(ALL_MODELS.length);
  });
});

describe("findModel", () => {
  it("finds model by id", () => {
    const model = findModel("whisper-1");
    expect(model).toBeDefined();
    expect(model?.id).toBe("whisper-1");
    expect(model?.provider).toBe("openai");
  });

  it("finds sarvam model", () => {
    const model = findModel("saaras:v3");
    expect(model).toBeDefined();
    expect(model?.provider).toBe("sarvam");
  });

  it("returns undefined for unknown id", () => {
    expect(findModel("unknown")).toBeUndefined();
  });
});

describe("PROVIDER_META", () => {
  it("has metadata for all providers", () => {
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
      expect(PROVIDER_META[p]).toBeDefined();
      expect(PROVIDER_META[p].label).toBeTruthy();
      expect(PROVIDER_META[p].color).toBeTruthy();
      expect(PROVIDER_META[p].bgClass).toBeTruthy();
      expect(PROVIDER_META[p].textClass).toBeTruthy();
    }
  });
});
