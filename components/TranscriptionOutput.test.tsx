import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TranscriptionOutput } from "./TranscriptionOutput";

describe("TranscriptionOutput", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("shows placeholder when empty", () => {
    render(
      <TranscriptionOutput
        theme="dark"
        segments={[]}
        fullText=""
        onClear={() => {}}
      />
    );
    expect(screen.getByText("Your words will appear here in real time...")).toBeInTheDocument();
  });

  it("shows Transcription label when empty", () => {
    render(
      <TranscriptionOutput
        theme="dark"
        segments={[]}
        fullText=""
        onClear={() => {}}
      />
    );
    expect(screen.getByText("Transcription")).toBeInTheDocument();
  });

  it("shows word count when has content", () => {
    render(
      <TranscriptionOutput
        theme="dark"
        segments={[{ id: 1, text: "Hello world", isFinal: true }]}
        fullText="Hello world"
        onClear={() => {}}
      />
    );
    expect(screen.getByText("2 words")).toBeInTheDocument();
  });

  it("shows 1 word for single word", () => {
    render(
      <TranscriptionOutput
        theme="dark"
        segments={[{ id: 1, text: "Hello", isFinal: true }]}
        fullText="Hello"
        onClear={() => {}}
      />
    );
    expect(screen.getByText("1 word")).toBeInTheDocument();
  });

  it("renders segments", () => {
    render(
      <TranscriptionOutput
        theme="dark"
        segments={[
          { id: 1, text: "Hello", isFinal: true },
          { id: 2, text: "world", isFinal: true },
        ]}
        fullText="Hello world"
        onClear={() => {}}
      />
    );
    expect(screen.getByText(/Hello/)).toBeInTheDocument();
    expect(screen.getByText(/world/)).toBeInTheDocument();
  });

  it("calls onClear when Clear button clicked", () => {
    const onClear = vi.fn();
    render(
      <TranscriptionOutput
        theme="dark"
        segments={[{ id: 1, text: "Hello", isFinal: true }]}
        fullText="Hello"
        onClear={onClear}
      />
    );
    fireEvent.click(screen.getByText("Clear"));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("disables Clear when empty", () => {
    render(
      <TranscriptionOutput
        theme="dark"
        segments={[]}
        fullText=""
        onClear={() => {}}
      />
    );
    const clearBtn = screen.getByText("Clear");
    expect(clearBtn).toBeDisabled();
  });

  it("copies to clipboard when Copy clicked", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: { writeText },
    });
    render(
      <TranscriptionOutput
        theme="dark"
        segments={[{ id: 1, text: "Hello", isFinal: true }]}
        fullText="Hello"
        onClear={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Copy"));
    expect(writeText).toHaveBeenCalledWith("Hello");
  });

  it("shows Copied! after copy", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(
      <TranscriptionOutput
        theme="dark"
        segments={[{ id: 1, text: "Hello", isFinal: true }]}
        fullText="Hello"
        onClear={() => {}}
      />
    );
    fireEvent.click(screen.getByText("Copy"));
    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });
  });
});
