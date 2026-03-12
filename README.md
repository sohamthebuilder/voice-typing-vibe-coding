# VoiceDrop

Real-time voice-to-text transcription using your choice of AI model. No login, no paywall — just speak.

<img width="715" height="391" alt="Screenshot 2026-03-12 at 5 00 56 PM" src="https://github.com/user-attachments/assets/579a8ef1-7f5f-4243-a7e1-1f9cee79f7aa" />


---

## Features

- **7 providers, 30+ models** — Pick OpenAI Whisper, Deepgram Nova/Flux, Azure STT, AWS Transcribe, AssemblyAI, ElevenLabs Scribe, or Sarvam (Indian languages). Mix streaming and chunked transcription in one app.
- **Language-first workflow** — Choose from a unified language list (including Auto-detect); the model dropdown only shows models that support your selected language.
- **Model-specific parameters** — Per-provider options (e.g. Deepgram: smart format, diarization, endpointing; OpenAI: prompt, temperature; Sarvam: mode, VAD; AWS: partial results stability, custom vocabulary).
- **Settings** — Mic device picker, punctuation on/off, profanity filter; model params live in a collapsible panel per provider.
- **API key panel** — Enter keys per provider (and region/secret where needed). Keys stay in `sessionStorage` and are never sent to our servers except for proxied requests (OpenAI).
- **Request body panel** — Inspect the last request payload (masked keys) for debugging and integration reference.
- **Status bar** — Live latency and word count.
- **Theme** — Dark / light mode with persistent preference.
- **Live audio visualizer** — Web Audio API level meter while recording.
- **Toasts & mic prompt** — Clear error feedback and a dedicated prompt when mic permission is denied.
- **Responsive layout** — Desktop: three-column layout; mobile: stacked layout with a slide-out sheet for API keys and settings.

---

## Supported Providers

| Provider        | Models | Connection |
|----------------|--------|------------|
| **OpenAI**     | Whisper-1 | Chunked via API route (near real-time) |
| **Deepgram**   | Flux (English), Nova-3, Nova-2, Enhanced, Base + domain variants (Medical, Meeting, Phonecall, Finance, etc.) | Direct WebSocket (live streaming) |
| **Azure STT**  | Latest (Unified), Conversation, Interactive, Dictation | Direct browser SDK (live streaming) |
| **AWS Transcribe** | General, Medical (English) | Direct WebSocket (live streaming) |
| **AssemblyAI** | Universal-3 RT Pro, Universal Streaming (English / Multilingual), Whisper RT | Direct WebSocket (live streaming) |
| **ElevenLabs** | Scribe v2 Realtime | Direct WebSocket (live streaming) |
| **Sarvam**     | Saaras v3, Saarika v2.5 (Legacy) | Direct WebSocket (live streaming); strong support for Indian languages |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and:

1. Expand the **API Keys** panel and enter a key (and region/secret if required) for your chosen provider.
2. Select a **language** (or leave on Auto-detect).
3. Select a **model** from the dropdown (filtered by language).
4. Optionally open **Settings** to pick a mic or tweak model parameters.
5. Hit the **record** button and start speaking.

---

## Tech Stack

- **Next.js 16** (App Router) with TypeScript
- **Tailwind CSS v4** for styling
- **Browser MediaRecorder API** for audio capture
- **Web Audio API** (AnalyserNode) for the live visualizer
- **microsoft-cognitiveservices-speech-sdk** for Azure STT
- **@aws-sdk/client-transcribe-streaming** for AWS Transcribe
- **ws** for WebSocket proxy where needed
- Provider abstraction in `lib/providers/*` with a single `TranscriptionProvider` interface; `useTranscription` hook instantiates the correct provider and handles segments/latency
- **API routes**: OpenAI proxy (`/api/transcribe/openai`), token endpoints for AssemblyAI and ElevenLabs where required, and optional key validation
- No database, no auth, no server-side persistence of keys or transcripts

---

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/voicedrop)

The app deploys to Vercel with zero configuration. API routes handle proxy duties for OpenAI and any server-assisted token exchange.

---

## Privacy

- API keys are stored in `sessionStorage` (browser only; cleared when the tab closes).
- Deepgram, Azure, AWS Transcribe, AssemblyAI, ElevenLabs, and Sarvam connect directly from the browser — keys never touch our server.
- OpenAI keys are sent through stateless Next.js API routes for CORS proxying only; they are not stored or logged.
- No analytics, no cookies, no tracking.

---

## Vibe coding: approach and how it was built

This project was built as a **vibe coding** exercise: a single, flexible voice-typing app that lets you try many STT providers without creating separate demos for each.

### Goal

- One UI to record, see live (or near real-time) transcription, and switch providers/models/languages quickly.
- No sign-up or backend user state; bring your own API keys and run entirely in the browser where possible.

### Planning

1. **Provider-agnostic flow**  
   Decide the flow once: **Language → Model → Record**. The UI would not be tied to a specific API; instead, a small abstraction would define “connect, send audio, receive transcript segments.”

2. **Streaming vs chunked**  
   Some APIs are WebSocket streaming (Deepgram, Azure, AWS, AssemblyAI, ElevenLabs, Sarvam); OpenAI is chunked (record → send chunks via REST). The app supports both: streaming providers get small timeslices (e.g. 250 ms), chunked gets larger buffers (e.g. 5 s).

3. **Key handling**  
   Keys in the browser only; stored in `sessionStorage`. For OpenAI, a thin Next.js API route would proxy requests so the browser never had to send the key to OpenAI directly from the client (CORS and key safety). Other providers would connect from the client using their official SDKs or WebSocket URLs.

4. **Extensibility**  
   Adding a new provider would mean implementing one interface (`TranscriptionProvider`), registering the model list and language support, and wiring it in the hook and UI — no redesign of the rest of the app.

### How it was built (iterative)

- **First:** Get one provider working end-to-end (e.g. OpenAI or Deepgram) — record, send audio, show text. That fixed the core loop: `useAudioRecorder` → chunks → `useTranscription` → segments on screen.

- **Then:** Introduce the provider abstraction (`lib/providers/types.ts`, one implementation per provider). The UI and hook then talked only to “a” provider; swapping provider was a config change.

- **Next:** Add providers one by one (Azure, AWS Transcribe, AssemblyAI, ElevenLabs, Sarvam). Each required reading the provider’s streaming/chunked API and mapping it to `connect / sendAudio / disconnect` and `onTranscript`. Where the provider needed a short-lived token (e.g. AssemblyAI, ElevenLabs), a small API route was added to exchange the key for a token.

- **Then:** Unify language handling — a single list of languages, with per-model language support so the model dropdown only shows models that support the selected language. That made the UX consistent across all providers.

- **After that:** Add model-specific parameters (e.g. Deepgram’s smart format, Sarvam’s mode). The settings panel and request payload were extended so each provider could expose its own options without cluttering the UI for others.

- **Polish:** Request body panel (for debugging and copy-paste), status bar (latency, word count), theme toggle, mic permission prompt, toasts for errors, and a responsive layout with a mobile settings sheet so the same app worked on small screens.

The result is a single codebase that supports seven providers and 30+ models with a consistent UX, built by iterating on one flow and one abstraction rather than building seven separate apps.
