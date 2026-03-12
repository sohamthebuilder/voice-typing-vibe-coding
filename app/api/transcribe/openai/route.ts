import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const apiKey = formData.get("apiKey") as string | null;
    const model = (formData.get("model") as string) || "whisper-1";
    const language = formData.get("language") as string | null;
    const prompt = formData.get("prompt") as string | null;
    const temperature = formData.get("temperature") as string | null;

    if (!audio || !apiKey) {
      return NextResponse.json(
        { error: "Missing audio or API key" },
        { status: 400 }
      );
    }

    const outForm = new FormData();
    outForm.append("file", audio, "audio.webm");
    outForm.append("model", model);
    if (language) {
      outForm.append("language", language);
    }
    if (prompt) {
      outForm.append("prompt", prompt);
    }
    if (temperature) {
      outForm.append("temperature", temperature);
    }
    outForm.append("response_format", "json");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: outForm,
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { error: `OpenAI API error: ${res.status} ${body}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ text: data.text || "" });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
