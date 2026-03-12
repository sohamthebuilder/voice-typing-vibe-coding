import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const tokenUrl = new URL("https://streaming.assemblyai.com/v3/token");
    tokenUrl.search = new URLSearchParams({
      expires_in_seconds: "480",
    }).toString();

    const res = await fetch(tokenUrl.toString(), {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || "Failed to generate token" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ token: data.token });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
