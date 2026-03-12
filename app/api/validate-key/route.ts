import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, region, secretKey } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ valid: false, error: "Missing fields" });
    }

    let valid = false;
    let error = "";

    switch (provider) {
      case "openai": {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        valid = res.ok;
        if (!valid) error = "Invalid OpenAI API key";
        break;
      }

      case "deepgram": {
        const res = await fetch("https://api.deepgram.com/v1/projects", {
          headers: { Authorization: `Token ${apiKey}` },
        });
        valid = res.ok;
        if (!valid) error = "Invalid Deepgram API key";
        break;
      }

      case "azure": {
        if (!region) {
          return NextResponse.json({
            valid: false,
            error: "Azure region required",
          });
        }
        const res = await fetch(
          `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
          {
            method: "POST",
            headers: {
              "Ocp-Apim-Subscription-Key": apiKey,
              "Content-Length": "0",
            },
          }
        );
        valid = res.ok;
        if (!valid) error = "Invalid Azure key or region";
        break;
      }

      case "aws-transcribe": {
        if (!region) {
          return NextResponse.json({
            valid: false,
            error: "AWS region required",
          });
        }
        if (!secretKey) {
          return NextResponse.json({
            valid: false,
            error: "AWS Secret Access Key required",
          });
        }
        try {
          const { STSClient, GetCallerIdentityCommand } = await import(
            "@aws-sdk/client-sts"
          );
          const sts = new STSClient({
            region,
            credentials: {
              accessKeyId: apiKey,
              secretAccessKey: secretKey,
            },
          });
          await sts.send(new GetCallerIdentityCommand({}));
          valid = true;
        } catch {
          error = "Invalid AWS credentials or region";
        }
        break;
      }

      case "assemblyai": {
        const res = await fetch("https://api.assemblyai.com/v2/transcript?limit=1", {
          headers: { Authorization: apiKey },
        });
        valid = res.ok;
        if (!valid) error = "Invalid AssemblyAI API key";
        break;
      }

      case "elevenlabs": {
        const res = await fetch("https://api.elevenlabs.io/v1/user", {
          headers: { "xi-api-key": apiKey },
        });
        valid = res.ok;
        if (!valid) error = "Invalid ElevenLabs API key";
        break;
      }

      case "sarvam": {
        const res = await fetch("https://api.sarvam.ai/speech-to-text-translate", {
          method: "POST",
          headers: {
            "api-subscription-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: "",
            source_language_code: "hi-IN",
            target_language_code: "en-IN",
            model: "saaras:v3",
          }),
        });
        valid = res.status !== 401 && res.status !== 403;
        if (!valid) error = "Invalid Sarvam API key";
        break;
      }

      default:
        error = "Unknown provider";
    }

    return NextResponse.json({ valid, error: valid ? undefined : error });
  } catch (err) {
    return NextResponse.json({ valid: false, error: String(err) });
  }
}
