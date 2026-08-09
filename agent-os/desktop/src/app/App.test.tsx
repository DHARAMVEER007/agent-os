import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  countUnread,
  mockNotifications,
  selectRead,
} from "../features/notifications/mockNotifications";
import { App } from "./App";

const { invoke, listen, onFocusChanged, startDragging } = vi.hoisted(() => ({
  invoke: vi.fn().mockResolvedValue(undefined),
  listen: vi.fn().mockResolvedValue(() => {}),
  onFocusChanged: vi.fn().mockResolvedValue(() => {}),
  startDragging: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tauri-apps/api/core", () => ({ invoke }));

vi.mock("@tauri-apps/api/event", () => ({ listen }));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ onFocusChanged, startDragging }),
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
    listen.mockReset();
    listen.mockResolvedValue(() => {});
    onFocusChanged.mockReset();
    onFocusChanged.mockResolvedValue(() => {});
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

  it("[critical] opens reply approval instead of dismissing the card", async () => {
    render(<App />);

    openPanel();
    await screen.findByRole("main", { name: panelName });

    fireEvent.click(
      screen.getByRole("button", { name: /Reply ready for review/ }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "I am going to send this reply",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("maya@company.com")).toBeInTheDocument();
    expect(screen.getByText(/Thursday works on my side/)).toBeInTheDocument();
    expect(screen.queryByText(`${unreadCount} new`)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Yes, send" }),
    ).toBeInTheDocument();
  });

  it("[critical] returns unread when Back is pressed from approval", async () => {
    render(<App />);

    openPanel();
    await screen.findByRole("main", { name: panelName });
    fireEvent.click(
      screen.getByRole("button", { name: /Reply ready for review/ }),
    );
    await screen.findByRole("heading", {
      name: "I am going to send this reply",
    });

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(
      await screen.findByRole("button", { name: /Reply ready for review/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(`${unreadCount} new`)).toBeInTheDocument();
  });

  it("[critical] removes the reply after Yes, send", async () => {
    render(<App />);

    openPanel();
    await screen.findByRole("main", { name: panelName });
    fireEvent.click(
      screen.getByRole("button", { name: /Reply ready for review/ }),
    );
    await screen.findByRole("heading", {
      name: "I am going to send this reply",
    });

    fireEvent.click(screen.getByRole("button", { name: "Yes, send" }));

    expect(
      await screen.findByText(`${unreadCount - 1} new`),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Reply ready for review/ }),
    ).not.toBeInTheDocument();
  });

  it("lets the user edit the draft before confirming", async () => {
    render(<App />);

    openPanel();
    await screen.findByRole("main", { name: panelName });
    fireEvent.click(
      screen.getByRole("button", { name: /Reply ready for review/ }),
    );
    await screen.findByRole("heading", {
      name: "I am going to send this reply",
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit reply" }));
    fireEvent.change(screen.getByLabelText("Reply subject"), {
      target: { value: "Re: Revised demo plan" },
    });
    fireEvent.change(screen.getByLabelText("Reply body"), {
      target: { value: "Updated draft body" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save and review" }));

    expect(screen.getByText("Re: Revised demo plan")).toBeInTheDocument();
    expect(screen.getByText("Updated draft body")).toBeInTheDocument();
    expect(
      screen.getByText("Draft updated. Confirm before sending."),
    ).toBeInTheDocument();
  });

  it("[critical] removes an info notification from the list once it is read", async () => {
    render(<App />);

    openPanel();
    await screen.findByRole("main", { name: panelName });

    fireEvent.click(
      screen.getByRole("button", { name: /Invoice needs approval/ }),
    );

    expect(
      screen.queryByText("Invoice needs approval"),
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

  it("[critical] opens Settings with account cards and connects Outlook", async () => {
    render(<App />);

    openPanel();
    await screen.findByRole("main", { name: panelName });

    fireEvent.click(screen.getByRole("button", { name: "Settings" }));

    expect(
      await screen.findByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Microsoft Outlook")).toBeInTheDocument();
    expect(screen.getByText("Microsoft Teams")).toBeInTheDocument();
    expect(screen.getAllByText("Coming soon").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    expect(
      await screen.findByRole("heading", { name: "Connect your mailbox" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Continue with Microsoft" }),
    );

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(
      screen.getByText(/Signed in as you@company.com/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Disconnect" }),
    ).toBeInTheDocument();
  });

  it("opens Settings when the tray asks for it", async () => {
    listen.mockImplementation(async (event: string, handler: () => void) => {
      if (event === "open-settings") {
        handler();
      }

      return () => {};
    });

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument();
    expect(invoke).toHaveBeenCalledWith("set_widget_expanded", {
      expanded: true,
    });
  });

  it("collapses the panel when the window loses focus", async () => {
    let focusHandler: ((event: { payload: boolean }) => void) | undefined;

    onFocusChanged.mockImplementation(async (handler) => {
      focusHandler = handler;
      return () => {};
    });

    render(<App />);
    openPanel();
    await screen.findByRole("main", { name: panelName });

    focusHandler?.({ payload: false });

    expect(
      await screen.findByRole("button", { name: openWidgetName }),
    ).toBeInTheDocument();
    expect(invoke).toHaveBeenCalledWith("set_widget_expanded", {
      expanded: false,
    });
  });

  it("toggles a notification preference from Settings", async () => {
    render(<App />);

    openPanel();
    await screen.findByRole("main", { name: panelName });
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));

    const quietHours = await screen.findByRole("switch", {
      name: "Quiet hours",
    });

    expect(quietHours).not.toBeChecked();
    fireEvent.click(quietHours);
    expect(quietHours).toBeChecked();
  });

  it("shows the Ask stub when that tab is selected", async () => {
    render(<App />);

    openPanel();
    await screen.findByRole("main", { name: panelName });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    expect(
      await screen.findByRole("heading", { name: `Ask ${agentName}` }),
    ).toBeInTheDocument();
  });
});
