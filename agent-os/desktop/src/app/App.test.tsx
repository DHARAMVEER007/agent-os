import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

const { startDragging } = vi.hoisted(() => ({
  startDragging: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ startDragging }),
}));

describe("App", () => {
  beforeEach(() => {
    startDragging.mockClear();
  });

  it("renders only the draggable AgentOS robot", () => {
    render(<App />);

    const robot = screen.getByRole("img", { name: "AgentOS robot" });

    expect(robot).toHaveAttribute("src", "/chatbot.png");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("starts native dragging from a primary-button press", () => {
    render(<App />);

    fireEvent.mouseDown(screen.getByRole("img", { name: "AgentOS robot" }), {
      button: 0,
    });

    expect(startDragging).toHaveBeenCalledOnce();
  });
});
