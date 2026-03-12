"use client";

import { useState, useRef, useCallback } from "react";
import { TranscriptionProvider, TranscriptResult, Provider } from "@/lib/providers/types";
import { DeepgramProvider } from "@/lib/providers/deepgram";
import { AzureProvider } from "@/lib/providers/azure";
import { OpenAIProvider } from "@/lib/providers/openai";
import { AwsTranscribeProvider } from "@/lib/providers/aws-transcribe";
import { AssemblyAIProvider } from "@/lib/providers/assemblyai";
import { ElevenLabsProvider } from "@/lib/providers/elevenlabs";
import { SarvamProvider } from "@/lib/providers/sarvam";
export interface TranscriptSegment {
  id: number;
  text: string;
  isFinal: boolean;
}

interface UseTranscriptionOptions {
  onError?: (err: Error) => void;
}

function createProvider(provider: Provider): TranscriptionProvider {
  switch (provider) {
    case "deepgram":
      return new DeepgramProvider();
    case "azure":
      return new AzureProvider();
    case "openai":
      return new OpenAIProvider();
    case "aws-transcribe":
      return new AwsTranscribeProvider();
    case "assemblyai":
      return new AssemblyAIProvider();
    case "elevenlabs":
      return new ElevenLabsProvider();
    case "sarvam":
      return new SarvamProvider();
  }
}

export function useTranscription(opts: UseTranscriptionOptions = {}) {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const providerRef = useRef<TranscriptionProvider | null>(null);
  const segIdRef = useRef(0);
  const interimIdRef = useRef<number | null>(null);
  const lastSendTime = useRef<number>(0);

  const connect = useCallback(
    async (config: {
      provider: Provider;
      apiKey: string;
      secretKey?: string;
      region?: string;
      model: string;
      language: string;
      punctuate: boolean;
      profanityFilter: boolean;
      modelParams?: Record<string, unknown>;
    }) => {
      const p = createProvider(config.provider);
      providerRef.current = p;

      p.onTranscript((result: TranscriptResult) => {
        if (lastSendTime.current) {
          setLatency(Date.now() - lastSendTime.current);
        }

        if (result.isFinal) {
          const interimToRemove = interimIdRef.current;
          interimIdRef.current = null;
          const id = ++segIdRef.current;
          setSegments((prev) => {
            const filtered = interimToRemove !== null
              ? prev.filter((s) => s.id !== interimToRemove)
              : prev;
            return [...filtered, { id, text: result.text, isFinal: true }];
          });
        } else {
          const id = interimIdRef.current ?? ++segIdRef.current;
          interimIdRef.current = id;
          setSegments((prev) => {
            const existing = prev.findIndex((s) => s.id === id);
            if (existing >= 0) {
              const copy = [...prev];
              copy[existing] = { id, text: result.text, isFinal: false };
              return copy;
            }
            return [...prev, { id, text: result.text, isFinal: false }];
          });
        }
      });

      p.onError((err: Error) => {
        opts.onError?.(err);
      });

      await p.connect({
        apiKey: config.apiKey,
        secretKey: config.secretKey,
        region: config.region,
        model: config.model,
        language: config.language,
        punctuate: config.punctuate,
        profanityFilter: config.profanityFilter,
        modelParams: config.modelParams,
      });
    },
    [opts]
  );

  const sendAudio = useCallback((chunk: Blob) => {
    lastSendTime.current = Date.now();
    providerRef.current?.sendAudio(chunk);
  }, []);

  const disconnect = useCallback(() => {
    providerRef.current?.disconnect();
    providerRef.current = null;
    interimIdRef.current = null;
  }, []);

  const clear = useCallback(() => {
    setSegments([]);
    segIdRef.current = 0;
    interimIdRef.current = null;
    setLatency(null);
  }, []);

  const fullText = segments.map((s) => s.text).join(" ");

  return {
    segments,
    fullText,
    latency,
    connect,
    sendAudio,
    disconnect,
    clear,
  };
}
