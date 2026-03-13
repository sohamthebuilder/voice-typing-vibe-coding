import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

describe("POST /api/validate-key", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns error when provider or apiKey missing", async () => {
    const req = new Request("http://localhost/api/validate-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toBe("Missing fields");
  });

  it("validates OpenAI key", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    const req = new Request("http://localhost/api/validate-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "openai", apiKey: "sk-test" }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/models",
      expect.objectContaining({
        headers: { Authorization: "Bearer sk-test" },
      })
    );
  });

  it("returns invalid for bad OpenAI key", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
    const req = new Request("http://localhost/api/validate-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "openai", apiKey: "bad" }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toBe("Invalid OpenAI API key");
  });

  it("requires region for Azure", async () => {
    const req = new Request("http://localhost/api/validate-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "azure", apiKey: "key" }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toBe("Azure region required");
  });

  it("requires region for AWS", async () => {
    const req = new Request("http://localhost/api/validate-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "aws-transcribe", apiKey: "key" }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toBe("AWS region required");
  });

  it("requires secretKey for AWS", async () => {
    const req = new Request("http://localhost/api/validate-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "aws-transcribe",
        apiKey: "key",
        region: "us-east-1",
      }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toBe("AWS Secret Access Key required");
  });

  it("validates Deepgram key", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    const req = new Request("http://localhost/api/validate-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "deepgram", apiKey: "token" }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.deepgram.com/v1/projects",
      expect.objectContaining({
        headers: { Authorization: "Token token" },
      })
    );
  });
});
