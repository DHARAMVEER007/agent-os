import { getCurrentWindow } from "@tauri-apps/api/window";
import type { MouseEvent } from "react";

export function App() {
  function startDragging(event: MouseEvent<HTMLElement>) {
    if (event.button === 0) {
      void getCurrentWindow().startDragging();
    }
  }

  return (
    <main
      aria-label="AgentOS floating widget"
      className="widget-shell"
      onMouseDown={startDragging}
    >
      <img
        alt="AgentOS robot"
        className="widget-robot"
        draggable={false}
        src="/chatbot.png"
      />
    </main>
  );
}
