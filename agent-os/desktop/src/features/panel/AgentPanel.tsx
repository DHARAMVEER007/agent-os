import type { MouseEvent as ReactMouseEvent } from "react";
import { useState } from "react";

import {
  BellIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GearIcon,
  GridIcon,
  MinusIcon,
  SparkleIcon,
} from "../../components/icons";
import { startWindowDrag } from "../../lib/tauri/widgetWindow";
import { ApprovalScreen } from "../approvals/ApprovalScreen";
import { iconFor, toneFor } from "../notifications/appearance";
import type {
  AgentNotification,
  ReplyDraft,
} from "../notifications/mockNotifications";
import {
  requiresReplyApproval,
  selectRead,
  selectUnread,
} from "../notifications/mockNotifications";
import { SettingsPanel } from "../settings/SettingsPanel";
import type {
  AccountId,
  ConnectedAccount,
  DesktopPreferences,
  NotificationPreferences,
} from "../settings/settingsModel";

export type PanelTab = "activity" | "ask" | "settings";

interface AgentPanelProps {
  activeTab: PanelTab;
  agentName: string;
  connectedAccounts: Partial<Record<AccountId, ConnectedAccount>>;
  desktopPreferences: DesktopPreferences;
  notificationPreferences: NotificationPreferences;
  notifications: AgentNotification[];
  onCollapse: () => void;
  onConnectOutlook: () => void;
  onDesktopChange: (next: DesktopPreferences) => void;
  onDisconnectOutlook: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: number) => void;
  onNotificationChange: (next: NotificationPreferences) => void;
  onSaveReplyDraft: (
    id: number,
    draft: Pick<ReplyDraft, "subject" | "draftBody">,
  ) => void;
  onTabChange: (tab: PanelTab) => void;
  productVersion: string;
  unreadCount: number;
}

export function AgentPanel({
  activeTab,
  agentName,
  connectedAccounts,
  desktopPreferences,
  notificationPreferences,
  notifications,
  onCollapse,
  onConnectOutlook,
  onDesktopChange,
  onDisconnectOutlook,
  onMarkAllRead,
  onMarkRead,
  onNotificationChange,
  onSaveReplyDraft,
  onTabChange,
  productVersion,
  unreadCount,
}: AgentPanelProps) {
  const [isShowingRead, setIsShowingRead] = useState(false);
  const [approvalId, setApprovalId] = useState<number | null>(null);

  const read = selectRead(notifications);
  const visible = isShowingRead ? read : selectUnread(notifications);
  const approvalCandidate =
    approvalId === null
      ? undefined
      : notifications.find((notification) => notification.id === approvalId);
  const approvalNotification =
    approvalCandidate && requiresReplyApproval(approvalCandidate)
      ? approvalCandidate
      : undefined;

  function dragFromHeader(event: ReactMouseEvent<HTMLElement>) {
    if (event.button === 0) {
      startWindowDrag();
    }
  }

  function handleNotificationClick(notification: AgentNotification) {
    if (notification.isRead) {
      return;
    }

    if (requiresReplyApproval(notification)) {
      setApprovalId(notification.id);
      return;
    }

    onMarkRead(notification.id);
  }

  function finishApproval(id: number) {
    onMarkRead(id);
    setApprovalId(null);
  }

  return (
    <main className="agent-panel" aria-label={`${agentName} assistant panel`}>
      <header className="panel-header" onMouseDown={dragFromHeader}>
        <div className="panel-identity">
          <img
            alt=""
            className="panel-robot"
            draggable={false}
            src="/chatbot.png"
          />
          <div>
            <p className="panel-eyebrow">Desktop companion</p>
            <h1>{agentName}</h1>
          </div>
        </div>
        <button
          aria-label={`Collapse ${agentName}`}
          className="icon-button"
          onClick={onCollapse}
          onMouseDown={(event) => event.stopPropagation()}
          type="button"
        >
          <MinusIcon className="glyph" />
        </button>
      </header>

      {activeTab === "activity" &&
        (approvalNotification ? (
          <ApprovalScreen
            agentName={agentName}
            notification={approvalNotification}
            onApprove={() => finishApproval(approvalNotification.id)}
            onBack={() => setApprovalId(null)}
            onReject={() => finishApproval(approvalNotification.id)}
            onSaveEdit={(draft) =>
              onSaveReplyDraft(approvalNotification.id, draft)
            }
          />
        ) : (
          <>
            <section className="panel-intro" aria-labelledby="greeting">
              <div>
                <p className="panel-eyebrow">Good afternoon</p>
                <h2 id="greeting">What needs your attention</h2>
              </div>
              <span className="status-pill">
                {unreadCount > 0 ? `${unreadCount} new` : "All caught up"}
              </span>
            </section>

            <section
              className="notifications"
              aria-labelledby="notifications-title"
            >
              <div className="section-heading">
                <h2 className="section-title" id="notifications-title">
                  <span className="section-badge" aria-hidden="true">
                    <BellIcon className="glyph" />
                  </span>
                  {isShowingRead ? "Already read" : "Needs attention"}
                </h2>
                {isShowingRead ? (
                  <button
                    className="text-button"
                    onClick={() => setIsShowingRead(false)}
                    type="button"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    className="text-button"
                    disabled={unreadCount === 0}
                    onClick={onMarkAllRead}
                    type="button"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {visible.length === 0 ? (
                <p className="empty-state">
                  {isShowingRead
                    ? "Nothing has been read yet."
                    : "You are all caught up. New activity will appear here."}
                </p>
              ) : (
                <ul className="notification-list">
                  {visible.map((notification) => {
                    const SourceIcon = iconFor(notification.source);

                    return (
                      <li key={notification.id}>
                        <button
                          className={`notification-card tone-${toneFor(notification)}${
                            notification.isRead
                              ? " notification-card--read"
                              : ""
                          }`}
                          disabled={notification.isRead}
                          onClick={() => handleNotificationClick(notification)}
                          type="button"
                        >
                          <span
                            className="notification-icon"
                            aria-hidden="true"
                          >
                            <SourceIcon className="glyph" />
                          </span>
                          <span className="notification-copy">
                            <span className="notification-source">
                              {notification.source}
                            </span>
                            <span className="notification-title">
                              {notification.title}
                            </span>
                            <span className="notification-detail">
                              {notification.detail}
                            </span>
                          </span>
                          <span className="notification-side">
                            <time>{notification.time}</time>
                            {!notification.isRead && (
                              <span
                                className="notification-dot"
                                aria-hidden="true"
                              />
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {(isShowingRead || read.length > 0) && (
              <div className="panel-footer">
                <button
                  className="pill-button"
                  onClick={() => setIsShowingRead(!isShowingRead)}
                  type="button"
                >
                  {isShowingRead ? "Hide read" : `Show ${read.length} read`}
                  {isShowingRead ? (
                    <ChevronUpIcon className="glyph" />
                  ) : (
                    <ChevronDownIcon className="glyph" />
                  )}
                </button>
              </div>
            )}
          </>
        ))}

      {activeTab === "ask" && (
        <section className="ask-panel" aria-labelledby="ask-title">
          <div className="panel-intro">
            <div>
              <p className="panel-eyebrow">Conversation</p>
              <h2 id="ask-title">Ask {agentName}</h2>
            </div>
          </div>
          <p className="empty-state">
            Chat with {agentName} will live here once the background service is
            connected. For now, review Activity and connect accounts in
            Settings.
          </p>
        </section>
      )}

      {activeTab === "settings" && (
        <SettingsPanel
          agentName={agentName}
          connectedAccounts={connectedAccounts}
          desktopPreferences={desktopPreferences}
          notificationPreferences={notificationPreferences}
          onConnectOutlook={onConnectOutlook}
          onDesktopChange={onDesktopChange}
          onDisconnectOutlook={onDisconnectOutlook}
          onNotificationChange={onNotificationChange}
          productVersion={productVersion}
        />
      )}

      <nav className="panel-nav" aria-label={`${agentName} sections`}>
        <button
          aria-current={activeTab === "activity" ? "page" : undefined}
          className={
            activeTab === "activity" ? "nav-item nav-item--active" : "nav-item"
          }
          onClick={() => onTabChange("activity")}
          type="button"
        >
          <GridIcon className="glyph" />
          Activity
        </button>
        <button
          aria-current={activeTab === "ask" ? "page" : undefined}
          className={
            activeTab === "ask" ? "nav-item nav-item--active" : "nav-item"
          }
          onClick={() => onTabChange("ask")}
          type="button"
        >
          <SparkleIcon className="glyph" />
          Ask
        </button>
        <button
          aria-current={activeTab === "settings" ? "page" : undefined}
          className={
            activeTab === "settings" ? "nav-item nav-item--active" : "nav-item"
          }
          onClick={() => onTabChange("settings")}
          type="button"
        >
          <GearIcon className="glyph" />
          Settings
        </button>
      </nav>
    </main>
  );
}
