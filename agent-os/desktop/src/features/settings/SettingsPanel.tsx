import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

import { RuntimeStatusCard } from "../runtime/RuntimeStatusCard";
import {
  getRuntimeStatus,
  initialRuntimeStatus,
} from "../../lib/tauri/runtime";
import type {
  AccountDefinition,
  AccountId,
  ConnectedAccount,
  DesktopPreferences,
  NotificationPreferences,
} from "./settingsModel";
import { accountCatalog } from "./settingsModel";

interface SettingsPanelProps {
  agentName: string;
  connectedAccounts: Partial<Record<AccountId, ConnectedAccount>>;
  desktopPreferences: DesktopPreferences;
  notificationPreferences: NotificationPreferences;
  onConnectOutlook: () => void;
  onDesktopChange: (next: DesktopPreferences) => void;
  onDisconnectOutlook: () => void;
  onNotificationChange: (next: NotificationPreferences) => void;
  productVersion: string;
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.checked);
  }

  return (
    <label className="settings-toggle">
      <span>{label}</span>
      <input
        aria-label={label}
        checked={checked}
        onChange={handleChange}
        role="switch"
        type="checkbox"
      />
    </label>
  );
}

function AccountCard({
  account,
  connected,
  onConnect,
  onDisconnect,
}: {
  account: AccountDefinition;
  connected?: ConnectedAccount;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const Icon = account.icon;
  const isComingSoon = account.availability === "comingSoon";
  const isConnected = Boolean(connected);

  return (
    <li className={`account-card tone-${account.tone}`}>
      <span className="notification-icon" aria-hidden="true">
        <Icon className="glyph" />
      </span>
      <div className="account-copy">
        <div className="account-heading">
          <h3>{account.name}</h3>
          {isComingSoon ? (
            <span className="account-status account-status--soon">
              Coming soon
            </span>
          ) : isConnected ? (
            <span className="account-status account-status--connected">
              Connected
            </span>
          ) : (
            <span className="account-status">Not connected</span>
          )}
        </div>
        <p>
          {isConnected && connected?.email
            ? `Signed in as ${connected.email}`
            : account.description}
        </p>
      </div>
      {!isComingSoon &&
        (isConnected ? (
          <button
            className="text-button account-action"
            onClick={onDisconnect}
            type="button"
          >
            Disconnect
          </button>
        ) : (
          <button
            className="text-button account-action"
            onClick={onConnect}
            type="button"
          >
            Connect
          </button>
        ))}
    </li>
  );
}

function OutlookConsentSheet({
  agentName,
  onCancel,
  onContinue,
}: {
  agentName: string;
  onCancel: () => void;
  onContinue: () => void;
}) {
  return (
    <div
      aria-labelledby="outlook-consent-title"
      aria-modal="true"
      className="consent-sheet"
      role="dialog"
    >
      <div className="consent-sheet__card">
        <p className="panel-eyebrow">Microsoft Outlook</p>
        <h3 id="outlook-consent-title">Connect your mailbox</h3>
        <p className="consent-sheet__copy">
          You’ll sign in with Microsoft. {agentName} never sees your password —
          only access tokens stored in your system keychain.
        </p>
        <ul className="consent-sheet__permissions">
          <li>Read new mail so drafts can be prepared</li>
          <li>Send mail only after you tap Yes, send</li>
          <li>Stay signed in while the companion is running</li>
        </ul>
        <p className="consent-sheet__note">
          This build uses a mock connection. Real OAuth arrives with the
          background service.
        </p>
        <div className="consent-sheet__actions">
          <button className="primary-button" onClick={onContinue} type="button">
            Continue with Microsoft
          </button>
          <button className="secondary-button" onClick={onCancel} type="button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsPanel({
  agentName,
  connectedAccounts,
  desktopPreferences,
  notificationPreferences,
  onConnectOutlook,
  onDesktopChange,
  onDisconnectOutlook,
  onNotificationChange,
  productVersion,
}: SettingsPanelProps) {
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState(initialRuntimeStatus);
  const [isCheckingRuntime, setIsCheckingRuntime] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getRuntimeStatus().then((status) => {
      if (!cancelled) {
        setRuntimeStatus(status);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshRuntimeStatus() {
    setIsCheckingRuntime(true);
    try {
      setRuntimeStatus(await getRuntimeStatus());
    } finally {
      setIsCheckingRuntime(false);
    }
  }

  function confirmOutlookConnect() {
    setIsConsentOpen(false);
    onConnectOutlook();
  }

  return (
    <div className="settings-panel">
      <section className="panel-intro" aria-labelledby="settings-title">
        <div>
          <p className="panel-eyebrow">Preferences</p>
          <h2 id="settings-title">Settings</h2>
        </div>
      </section>

      <div className="settings-scroll">
        <section
          className="settings-section"
          aria-labelledby="accounts-heading"
        >
          <h3 className="settings-section__title" id="accounts-heading">
            Accounts
          </h3>
          <p className="settings-section__hint">
            Connect the services {agentName} can monitor. Outlook is ready to
            try; the rest arrive after Version 1.
          </p>
          <ul className="account-list">
            {accountCatalog.map((account) => (
              <AccountCard
                account={account}
                connected={connectedAccounts[account.id]}
                key={account.id}
                onConnect={() => setIsConsentOpen(true)}
                onDisconnect={onDisconnectOutlook}
              />
            ))}
          </ul>
        </section>

        <section
          className="settings-section"
          aria-labelledby="notifications-heading"
        >
          <h3 className="settings-section__title" id="notifications-heading">
            Notifications
          </h3>
          <div className="settings-card">
            <Toggle
              checked={notificationPreferences.quietHours}
              label="Quiet hours"
              onChange={(quietHours) =>
                onNotificationChange({
                  ...notificationPreferences,
                  quietHours,
                })
              }
            />
            <Toggle
              checked={notificationPreferences.badgeForEmail}
              label="Badge for email"
              onChange={(badgeForEmail) =>
                onNotificationChange({
                  ...notificationPreferences,
                  badgeForEmail,
                })
              }
            />
            <Toggle
              checked={notificationPreferences.badgeForCalendar}
              label="Badge for calendar"
              onChange={(badgeForCalendar) =>
                onNotificationChange({
                  ...notificationPreferences,
                  badgeForCalendar,
                })
              }
            />
            <Toggle
              checked={notificationPreferences.badgeForChat}
              label="Badge for chat apps"
              onChange={(badgeForChat) =>
                onNotificationChange({
                  ...notificationPreferences,
                  badgeForChat,
                })
              }
            />
            <Toggle
              checked={notificationPreferences.osNotifications}
              label="System notifications"
              onChange={(osNotifications) =>
                onNotificationChange({
                  ...notificationPreferences,
                  osNotifications,
                })
              }
            />
          </div>
        </section>

        <section className="settings-section" aria-labelledby="desktop-heading">
          <h3 className="settings-section__title" id="desktop-heading">
            Desktop
          </h3>
          <div className="settings-card">
            <Toggle
              checked={desktopPreferences.launchAtLogin}
              label="Launch at login"
              onChange={(launchAtLogin) =>
                onDesktopChange({ ...desktopPreferences, launchAtLogin })
              }
            />
            <Toggle
              checked={desktopPreferences.alwaysOnTop}
              label="Keep widget on top"
              onChange={(alwaysOnTop) =>
                onDesktopChange({ ...desktopPreferences, alwaysOnTop })
              }
            />
          </div>
        </section>

        <section className="settings-section" aria-labelledby="about-heading">
          <h3 className="settings-section__title" id="about-heading">
            About
          </h3>
          <div className="settings-card about-card">
            <p>
              <strong>{agentName}</strong> is your desktop companion inside
              AgentOS.
            </p>
            <dl className="about-meta">
              <div>
                <dt>Product</dt>
                <dd>AgentOS</dd>
              </div>
              <div>
                <dt>Version</dt>
                <dd>{productVersion}</dd>
              </div>
            </dl>
          </div>
          <RuntimeStatusCard
            isChecking={isCheckingRuntime}
            onRefresh={refreshRuntimeStatus}
            status={runtimeStatus}
          />
        </section>
      </div>

      {isConsentOpen && (
        <OutlookConsentSheet
          agentName={agentName}
          onCancel={() => setIsConsentOpen(false)}
          onContinue={confirmOutlookConnect}
        />
      )}
    </div>
  );
}
