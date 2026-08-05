import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  countUnread,
  mockNotifications,
  selectRead,
} from "../features/notifications/mockNotifications";
import { App } from "./App";

const { invoke, startDragging } = vi.hoisted(() => ({
  invoke: vi.fn().mockResolvedValue(undefined),
  startDragging: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tauri-apps/api/core", () => ({ invoke }));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ startDragging }),
}));

const unreadCount = countUnread(mockNotifications);
const readCount = selectRead(mockNotifications).length;
const agentName = "Rajveer";
const openWidgetName = `Open ${agentName} — ${unreadCount} unread notifications`;
const panelName = `${agentName} assistant panel`;
const collapseLabel = `Collapse ${agentName}`;

function openPanel() {
  const widget = screen.getByRole("button", { name: openWidgetName });

  fireEvent.mouseDown(widget, { button: 0, clientX: 100, clientY: 100 });
  fireEvent.mouseUp(window, { clientX: 100, clientY: 100 });
  fireEvent.click(widget);
}

describe("App", () => {
  beforeEach(() => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: {},
    });
    invoke.mockClear();
    startDragging.mockClear();
  });

  it("[critical] renders the collapsed widget with an unread badge", () => {
    render(<App />);

    const widget = screen.getByRole("button", { name: openWidgetName });

    expect(widget.querySelector("img")).toHaveAttribute("src", "/chatbot.png");
    expect(widget).toHaveTextContent(String(unreadCount));
  });

  it("[critical] expands to the mock panel and resizes the native window", async () => {
    render(<App />);

    openPanel();

    expect(
      await screen.findByRole("main", { name: panelName }),
    ).toBeInTheDocument();
    expect(screen.getByText("Reply ready for review")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: agentName }),
    ).toBeInTheDocument();
    expect(invoke).toHaveBeenCalledWith("set_widget_expanded", {
      expanded: true,
    });
  });

  it("[critical] lists only the notifications that still need attention", async () => {
    render(<App />);

    openPanel();
    await screen.findByRole("main", { name: panelName });

    expect(screen.getAllByRole("listitem")).toHaveLength(unreadCount);
    expect(screen.getByText(`${unreadCount} new`)).toBeInTheDocument();
  });

  it("[critical] removes a notification from the list once it is read", async () => {
    render(<App />);

    openPanel();
    await screen.findByRole("main", { name: panelName });

    fireEvent.click(
      screen.getByRole("button", { name: /Reply ready for review/ }),
    );

    expect(
      screen.queryByText("Reply ready for review"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(unreadCount - 1);
    expect(screen.getByText(`${unreadCount - 1} new`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: collapseLabel }));

    expect(
      await screen.findByRole("button", {
        name: `Open ${agentName} — ${unreadCount - 1} unread notifications`,
      }),
    ).toBeInTheDocument();
  });

  it("[critical] empties the list and clears the badge when everything is read", async () => {
    render(<App />);

    openPanel();
    await screen.findByRole("main", { name: panelName });

    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));

    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getByText(/You are all caught up/)).toBeInTheDocument();
    expect(screen.getByText("All caught up")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: collapseLabel }));

    expect(
      await screen.findByRole("button", { name: `Open ${agentName}` }),
    ).toBeInTheDocument();
  });

  it("keeps read notifications reachable behind the read view", async () => {
    render(<App />);

    openPanel();
    await screen.findByRole("main", { name: panelName });

    fireEvent.click(
      screen.getByRole("button", { name: `Show ${readCount} read` }),
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(readCount);
    expect(screen.getByText("Already read")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(unreadCount);
  });

  it("collapses from the panel control", async () => {
    render(<App />);

    openPanel();
    await screen.findByRole("main", { name: panelName });

    fireEvent.click(screen.getByRole("button", { name: collapseLabel }));

    expect(
      await screen.findByRole("button", { name: openWidgetName }),
    ).toBeInTheDocument();
    expect(invoke).toHaveBeenCalledWith("set_widget_expanded", {
      expanded: false,
    });
  });

  it("collapses the expanded panel when Escape is pressed", async () => {
    render(<App />);

    openPanel();
    await screen.findByRole("main", { name: panelName });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(
      await screen.findByRole("button", { name: openWidgetName }),
    ).toBeInTheDocument();
  });

  it("drags the window from the panel header", async () => {
    render(<App />);

    openPanel();
    const panel = await screen.findByRole("main", {
      name: panelName,
    });

    fireEvent.mouseDown(panel.querySelector(".panel-header") as HTMLElement, {
      button: 0,
    });

    expect(startDragging).toHaveBeenCalledOnce();
  });
});
