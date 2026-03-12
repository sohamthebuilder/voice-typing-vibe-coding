# VoiceDrop

Real-time voice-to-text transcription using your choice of AI model. No login, no paywall — just speak.

<img width="798" height="395" alt="Screenshot 2026-03-12 at 5 00 56 PM" src="https://github.com/user-attachments/assets/4f045ce0-9e9a-44ab-b8a8-23eea68b3702" />


## Supported Providers

| Provider | Models | Connection |
|----------|--------|------------|
| **OpenAI** | Whisper-1 | Chunked via API route (near real-time) |
| **Deepgram** | Nova-2, Nova-3, Enhanced, Base + variants | Direct WebSocket (live streaming) |
| **Azure STT** | Latest, Conversation, Interactive, Dictation | Direct browser SDK (live streaming) |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and:

1. Expand the **API Keys** panel and enter a key for your chosen provider
2. Select a **model** from the dropdown
3. Pick a **language** (or leave on Auto-detect)
4. Hit the **record button** and start speaking

## Tech Stack

- **Next.js 16** (App Router) with TypeScript
- **Tailwind CSS v4** for styling
- **Browser MediaRecorder API** for audio capture
- **Web Audio API** (AnalyserNode) for live visualizer
- **microsoft-cognitiveservices-speech-sdk** for Azure STT
- No database, no auth, no backend persistence

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/voicedrop)

The app deploys to Vercel with zero configuration. API routes handle proxy duties for OpenAI.

## Privacy

- API keys are stored in `sessionStorage` (browser only, cleared when tab closes)
- Deepgram and Azure connect directly from the browser — keys never touch the server
- OpenAI keys transit through stateless Next.js API routes for CORS proxying but are never stored or logged
- No analytics, no cookies, no tracking
