import { useCallback, useEffect, useState } from "react";

import {
  countUnread,
  markAllRead,
  markRead,
  mockNotifications,
  updateReplyDraft,
} from "../features/notifications/mockNotifications";
import type {
  AgentNotification,
  ReplyDraft,
} from "../features/notifications/mockNotifications";
import type { PanelTab } from "../features/panel/AgentPanel";
import { AgentPanel } from "../features/panel/AgentPanel";
import {
  connectOutlook,
  initialConnectedAccounts,
  initialDesktopPreferences,
  initialNotificationPreferences,
} from "../features/settings/settingsModel";
import type {
  AccountId,
  ConnectedAccount,
  DesktopPreferences,
  NotificationPreferences,
} from "../features/settings/settingsModel";
import { FloatingWidget } from "../features/widget/FloatingWidget";
import {
  loadNotifications,
  markAllNotificationsReadRemote,
  markNotificationReadRemote,
  saveReplyDraftRemote,
} from "../lib/api/notifications";
import {
  onOpenSettingsRequest,
  onWindowBlur,
  setWidgetExpanded,
} from "../lib/tauri/widgetWindow";

/// The assistant the user talks to. AgentOS stays the name of the product and
/// the application bundle.
const AGENT_NAME = "Rajveer";
const PRODUCT_VERSION = "0.1.0";

export function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>("activity");
  const [notifications, setNotifications] =
    useState<AgentNotification[]>(mockNotifications);
  const [connectedAccounts, setConnectedAccounts] = useState(
    initialConnectedAccounts,
  );
  const [notificationPreferences, setNotificationPreferences] = useState(
    initialNotificationPreferences,
  );
  const [desktopPreferences, setDesktopPreferences] = useState(
    initialDesktopPreferences,
  );
  const unreadCount = countUnread(notifications);

  useEffect(() => {
    let cancelled = false;

    void loadNotifications().then((items) => {
      if (!cancelled) {
        setNotifications(items);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const changeExpandedState = useCallback(async (expanded: boolean) => {
    await setWidgetExpanded(expanded);
    setIsExpanded(expanded);
  }, []);

  const openSettingsTab = useCallback(async () => {
    await setWidgetExpanded(true);
    setIsExpanded(true);
    setActiveTab("settings");
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

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    let disposed = false;
    let unsubscribe = () => {};

    void onWindowBlur(() => {
      void changeExpandedState(false);
    }).then((stop) => {
      if (disposed) {
        stop();
        return;
      }

      unsubscribe = stop;
    });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [changeExpandedState, isExpanded]);

  useEffect(() => {
    let disposed = false;
    let unsubscribe = () => {};

    void onOpenSettingsRequest(() => {
      void openSettingsTab();
    }).then((stop) => {
      if (disposed) {
        stop();
        return;
      }

      unsubscribe = stop;
    });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [openSettingsTab]);

  function handleConnectOutlook() {
    setConnectedAccounts((current) => ({
      ...current,
      outlook: connectOutlook(),
    }));
  }

  function handleDisconnectOutlook() {
    setConnectedAccounts((current) => {
      const next: Partial<Record<AccountId, ConnectedAccount>> = {
        ...current,
      };
      delete next.outlook;
      return next;
    });
  }

  async function handleMarkRead(id: number) {
    setNotifications((current) => markRead(current, id));
    const remote = await markNotificationReadRemote(id);
    if (remote) {
      setNotifications(remote);
    }
  }

  async function handleMarkAllRead() {
    setNotifications(markAllRead);
    const remote = await markAllNotificationsReadRemote();
    if (remote) {
      setNotifications(remote);
    }
  }

  async function handleSaveReplyDraft(
    id: number,
    draft: Pick<ReplyDraft, "subject" | "draftBody">,
  ) {
    setNotifications((current) => updateReplyDraft(current, id, draft));
    const remote = await saveReplyDraftRemote(id, draft);
    if (remote) {
      setNotifications(remote);
    }
  }

  if (isExpanded) {
    return (
      <AgentPanel
        activeTab={activeTab}
        agentName={AGENT_NAME}
        connectedAccounts={connectedAccounts}
        desktopPreferences={desktopPreferences}
        notificationPreferences={notificationPreferences}
        notifications={notifications}
        onCollapse={() => void changeExpandedState(false)}
        onConnectOutlook={handleConnectOutlook}
        onDesktopChange={(next: DesktopPreferences) =>
          setDesktopPreferences(next)
        }
        onDisconnectOutlook={handleDisconnectOutlook}
        onMarkAllRead={() => void handleMarkAllRead()}
        onMarkRead={(id) => void handleMarkRead(id)}
        onNotificationChange={(next: NotificationPreferences) =>
          setNotificationPreferences(next)
        }
        onSaveReplyDraft={(id, draft) => void handleSaveReplyDraft(id, draft)}
        onTabChange={setActiveTab}
        productVersion={PRODUCT_VERSION}
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
