import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

import { startWindowDrag } from "../../lib/tauri/widgetWindow";

// Pointer travel that separates a deliberate drag from an imprecise click.
const DRAG_THRESHOLD_PX = 3;

interface FloatingWidgetProps {
  agentName: string;
  onOpen: () => void;
  unreadCount: number;
}

function openLabel(agentName: string, unreadCount: number) {
  if (unreadCount === 0) {
    return `Open ${agentName}`;
  }

  const suffix = unreadCount === 1 ? "notification" : "notifications";
  return `Open ${agentName} — ${unreadCount} unread ${suffix}`;
}

export function FloatingWidget({
  agentName,
  onOpen,
  unreadCount,
}: FloatingWidgetProps) {
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    if (!isPressed) {
      return;
    }

    function handOverToNativeDrag(event: MouseEvent) {
      const origin = dragOrigin.current;

      if (!origin || hasDragged.current) {
        return;
      }

      const distance = Math.hypot(
        event.clientX - origin.x,
        event.clientY - origin.y,
      );

      if (distance < DRAG_THRESHOLD_PX) {
        return;
      }

      hasDragged.current = true;
      startWindowDrag();
    }

    function endPress() {
      dragOrigin.current = null;
      setIsPressed(false);
    }

    window.addEventListener("mousemove", handOverToNativeDrag);
    window.addEventListener("mouseup", endPress);

    return () => {
      window.removeEventListener("mousemove", handOverToNativeDrag);
      window.removeEventListener("mouseup", endPress);
    };
  }, [isPressed]);

  function beginPress(event: ReactMouseEvent<HTMLButtonElement>) {
    if (event.button !== 0) {
      return;
    }

    dragOrigin.current = { x: event.clientX, y: event.clientY };
    hasDragged.current = false;
    setIsPressed(true);
  }

  function openUnlessDragged() {
    if (hasDragged.current) {
      return;
    }

    onOpen();
  }

  return (
    <main aria-label={`${agentName} floating widget`} className="widget-shell">
      <button
        aria-label={openLabel(agentName, unreadCount)}
        className="widget-button"
        onClick={openUnlessDragged}
        onMouseDown={beginPress}
        type="button"
      >
        <img
          alt=""
          className="widget-robot"
          draggable={false}
          src="/chatbot.png"
        />
        {unreadCount > 0 && (
          <span className="unread-badge" aria-hidden="true">
            {unreadCount}
          </span>
        )}
      </button>
    </main>
  );
}
