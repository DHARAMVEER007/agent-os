import { useCallback, useEffect, useState } from "react";

import {
  countUnread,
  markAllRead,
  markRead,
  mockNotifications,
} from "../features/notifications/mockNotifications";
import { AgentPanel } from "../features/panel/AgentPanel";
import { FloatingWidget } from "../features/widget/FloatingWidget";
import { setWidgetExpanded } from "../lib/tauri/widgetWindow";

/// The assistant the user talks to. AgentOS stays the name of the product and
/// the application bundle.
const AGENT_NAME = "Rajveer";

export function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = countUnread(notifications);

  const changeExpandedState = useCallback(async (expanded: boolean) => {
    await setWidgetExpanded(expanded);
    setIsExpanded(expanded);
  }, []);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    function collapseOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        void changeExpandedState(false);
      }
    }

    window.addEventListener("keydown", collapseOnEscape);
    return () => window.removeEventListener("keydown", collapseOnEscape);
  }, [changeExpandedState, isExpanded]);

  if (isExpanded) {
    return (
      <AgentPanel
        agentName={AGENT_NAME}
        notifications={notifications}
        onCollapse={() => void changeExpandedState(false)}
        onMarkAllRead={() => setNotifications(markAllRead)}
        onMarkRead={(id) =>
          setNotifications((current) => markRead(current, id))
        }
        unreadCount={unreadCount}
      />
    );
  }

  return (
    <FloatingWidget
      agentName={AGENT_NAME}
      onOpen={() => void changeExpandedState(true)}
      unreadCount={unreadCount}
    />
  );
}
