import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBar } from "./StatusBar";

describe("StatusBar", () => {
  it("shows word count", () => {
    render(
      <StatusBar
        theme="dark"
        fullText="Hello world test"
        modelId={null}
        latency={null}
      />
    );
    expect(screen.getByText("3 words")).toBeInTheDocument();
  });

  it("shows 1 word for single word", () => {
    render(
      <StatusBar
        theme="dark"
        fullText="Hello"
        modelId={null}
        latency={null}
      />
    );
    expect(screen.getByText("1 word")).toBeInTheDocument();
  });

  it("shows model name and provider when modelId provided", () => {
    render(
      <StatusBar
        theme="dark"
        fullText=""
        modelId="whisper-1"
        latency={null}
      />
    );
    expect(screen.getByText(/Whisper-1/)).toBeInTheDocument();
    expect(screen.getByText(/OpenAI/)).toBeInTheDocument();
  });

  it("shows latency when provided", () => {
    render(
      <StatusBar
        theme="dark"
        fullText=""
        modelId={null}
        latency={250}
      />
    );
    expect(screen.getByText("250ms")).toBeInTheDocument();
  });

  it("shows 0 words for empty text", () => {
    render(
      <StatusBar
        theme="dark"
        fullText=""
        modelId={null}
        latency={null}
      />
    );
    expect(screen.getByText("0 words")).toBeInTheDocument();
  });
});
