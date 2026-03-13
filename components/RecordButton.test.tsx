import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecordButton } from "./RecordButton";

describe("RecordButton", () => {
  it("renders start/stop icon based on isRecording", () => {
    const { rerender } = render(
      <RecordButton
        theme="dark"
        isRecording={false}
        duration={0}
        onToggle={() => {}}
      />
    );
    expect(screen.getByTitle("Start recording")).toBeInTheDocument();

    rerender(
      <RecordButton
        theme="dark"
        isRecording={true}
        duration={0}
        onToggle={() => {}}
      />
    );
    expect(screen.getByTitle("Stop recording")).toBeInTheDocument();
  });

  it("shows duration when recording", () => {
    render(
      <RecordButton
        theme="dark"
        isRecording={true}
        duration={65}
        onToggle={() => {}}
      />
    );
    expect(screen.getByText("01:05")).toBeInTheDocument();
  });

  it("hides duration when not recording", () => {
    render(
      <RecordButton
        theme="dark"
        isRecording={false}
        duration={65}
        onToggle={() => {}}
      />
    );
    expect(screen.queryByText("01:05")).not.toBeInTheDocument();
  });

  it("calls onToggle when clicked", () => {
    const onToggle = vi.fn();
    render(
      <RecordButton
        theme="dark"
        isRecording={false}
        duration={0}
        onToggle={onToggle}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("does not call onToggle when disabled", () => {
    const onToggle = vi.fn();
    render(
      <RecordButton
        theme="dark"
        isRecording={false}
        duration={0}
        onToggle={onToggle}
        disabled={true}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("shows disabled reason when disabled", () => {
    render(
      <RecordButton
        theme="dark"
        isRecording={false}
        duration={0}
        onToggle={() => {}}
        disabled={true}
        disabledReason="Select a language first"
      />
    );
    expect(screen.getByText("Select a language first")).toBeInTheDocument();
    expect(screen.getByTitle("Select a language first")).toBeInTheDocument();
  });
});
