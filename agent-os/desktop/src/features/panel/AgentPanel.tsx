import { useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

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
import { iconFor, toneFor } from "../notifications/appearance";
import type { AgentNotification } from "../notifications/mockNotifications";
import { selectRead, selectUnread } from "../notifications/mockNotifications";

interface AgentPanelProps {
  agentName: string;
  notifications: AgentNotification[];
  onCollapse: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: number) => void;
  unreadCount: number;
}

export function AgentPanel({
  agentName,
  notifications,
  onCollapse,
  onMarkAllRead,
  onMarkRead,
  unreadCount,
}: AgentPanelProps) {
  const [isShowingRead, setIsShowingRead] = useState(false);

  const read = selectRead(notifications);
  const visible = isShowingRead ? read : selectUnread(notifications);

  function dragFromHeader(event: ReactMouseEvent<HTMLElement>) {
    if (event.button === 0) {
      startWindowDrag();
    }
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

      <section className="panel-intro" aria-labelledby="greeting">
        <div>
          <p className="panel-eyebrow">Good afternoon</p>
          <h2 id="greeting">What needs your attention</h2>
        </div>
        <span className="status-pill">
          {unreadCount > 0 ? `${unreadCount} new` : "All caught up"}
        </span>
      </section>

      <section className="notifications" aria-labelledby="notifications-title">
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
                      notification.isRead ? " notification-card--read" : ""
                    }`}
                    disabled={notification.isRead}
                    onClick={() => onMarkRead(notification.id)}
                    type="button"
                  >
                    <span className="notification-icon" aria-hidden="true">
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
                        <span className="notification-dot" aria-hidden="true" />
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

      <nav className="panel-nav" aria-label={`${agentName} sections`}>
        <button className="nav-item nav-item--active" type="button">
          <GridIcon className="glyph" />
          Activity
        </button>
        <button className="nav-item" type="button">
          <SparkleIcon className="glyph" />
          Ask
        </button>
        <button className="nav-item" type="button">
          <GearIcon className="glyph" />
          Settings
        </button>
      </nav>
    </main>
  );
}
