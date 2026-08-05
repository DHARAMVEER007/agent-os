import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FloatingWidget } from "./FloatingWidget";

// Edge categories for FloatingWidget:
//   - Null/undefined: N/A — both props are required and non-nullable.
//   - Empty collection: covered by the zero-unread badge case.
//   - Error path: N/A — the component has no failure mode of its own.
//   - External failure: N/A — the native drag call is fire-and-forget in lib/tauri.
//   - Concurrency: N/A — single-window, single user gesture.
//   - Boundary arithmetic: covered by the unread-count boundary cases.
//   - Tenant isolation: N/A — no tenant-scoped data in the desktop shell.
//   - Encoding/locale: N/A — no user-supplied strings rendered here yet.
//   - Idempotency: covered by "a drag does not also open the panel".

const { startWindowDrag } = vi.hoisted(() => ({
  startWindowDrag: vi.fn(),
}));

vi.mock("../../lib/tauri/widgetWindow", () => ({ startWindowDrag }));

const agentName = "Rajveer";
const onOpen = vi.fn();

function renderWidget(unreadCount: number) {
  return render(
    <FloatingWidget
      agentName={agentName}
      onOpen={onOpen}
      unreadCount={unreadCount}
    />,
  );
}

function pressAndMoveBy(element: HTMLElement, deltaX: number, deltaY: number) {
  fireEvent.mouseDown(element, { button: 0, clientX: 100, clientY: 100 });
  fireEvent.mouseMove(window, {
    clientX: 100 + deltaX,
    clientY: 100 + deltaY,
  });
}

describe("FloatingWidget", () => {
  beforeEach(() => {
    onOpen.mockClear();
    startWindowDrag.mockClear();
  });

  it("[critical] opens the panel from a click that did not move", () => {
    renderWidget(3);

    const widget = screen.getByRole("button");
    fireEvent.mouseDown(widget, { button: 0, clientX: 100, clientY: 100 });
    fireEvent.mouseUp(window, { clientX: 100, clientY: 100 });
    fireEvent.click(widget);

    expect(onOpen).toHaveBeenCalledOnce();
    expect(startWindowDrag).not.toHaveBeenCalled();
  });

  it("[critical] starts a native drag instead of opening once the pointer travels", () => {
    renderWidget(3);

    const widget = screen.getByRole("button");
    pressAndMoveBy(widget, 12, 0);
    fireEvent.mouseUp(window);
    fireEvent.click(widget);

    expect(startWindowDrag).toHaveBeenCalledOnce();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("treats travel below the drag threshold as a click", () => {
    renderWidget(3);

    const widget = screen.getByRole("button");
    pressAndMoveBy(widget, 2, 0);
    fireEvent.mouseUp(window);
    fireEvent.click(widget);

    expect(startWindowDrag).not.toHaveBeenCalled();
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("opens on the press after a drag", () => {
    renderWidget(3);

    const widget = screen.getByRole("button");
    pressAndMoveBy(widget, 40, 40);
    fireEvent.mouseUp(window);
    fireEvent.click(widget);

    fireEvent.mouseDown(widget, { button: 0, clientX: 300, clientY: 300 });
    fireEvent.mouseUp(window);
    fireEvent.click(widget);

    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("ignores non-primary mouse buttons", () => {
    renderWidget(3);

    const widget = screen.getByRole("button");
    fireEvent.mouseDown(widget, { button: 2, clientX: 100, clientY: 100 });
    fireEvent.mouseMove(window, { clientX: 300, clientY: 300 });

    expect(startWindowDrag).not.toHaveBeenCalled();
  });

  it.each([
    [0, "Open Rajveer"],
    [1, "Open Rajveer — 1 unread notification"],
    [12, "Open Rajveer — 12 unread notifications"],
  ])("labels the widget for an unread count of %i", (unreadCount, label) => {
    renderWidget(unreadCount);

    expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
  });

  it("hides the badge when nothing is unread", () => {
    const { container } = renderWidget(0);

    expect(container.querySelector(".unread-badge")).toBeNull();
  });
});
