import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { showToast, ToastContainer } from "./Toast";

describe("Toast", () => {
  it("ToastContainer shows toast when showToast is called", async () => {
    render(<ToastContainer theme="dark" />);
    showToast("Error message", "error");
    await waitFor(() => {
      expect(screen.getByText("Error message")).toBeInTheDocument();
    });
  });

  it("ToastContainer renders nothing when no toasts", () => {
    const { container } = render(<ToastContainer theme="dark" />);
    expect(container.firstChild).toBeNull();
  });

  it("dismisses toast when close button clicked", async () => {
    render(<ToastContainer theme="dark" />);
    showToast("Dismiss me");
    await waitFor(() => {
      expect(screen.getByText("Dismiss me")).toBeInTheDocument();
    });
    const closeBtn = screen.getByRole("button");
    fireEvent.click(closeBtn);
    expect(screen.queryByText("Dismiss me")).not.toBeInTheDocument();
  });

  it("auto-dismisses toast after 5 seconds", async () => {
    render(<ToastContainer theme="dark" />);
    showToast("Auto dismiss");
    await waitFor(() => {
      expect(screen.getByText("Auto dismiss")).toBeInTheDocument();
    });
    await new Promise((r) => setTimeout(r, 5100));
    expect(screen.queryByText("Auto dismiss")).not.toBeInTheDocument();
  }, 10000);
});
