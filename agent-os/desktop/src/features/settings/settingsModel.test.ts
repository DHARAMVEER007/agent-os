import { describe, expect, it } from "vitest";

import {
  accountCatalog,
  connectOutlook,
  initialConnectedAccounts,
  initialDesktopPreferences,
  initialNotificationPreferences,
} from "./settingsModel";

// Edge categories for settings model helpers:
//   - Null/undefined: N/A — catalog and defaults are constants.
//   - Empty collection: covered by initialConnectedAccounts being empty.
//   - Error path: N/A — pure fixtures with no failure mode.
//   - External failure: N/A — no I/O yet; OAuth arrives later.
//   - Concurrency: N/A — React state owns mutations.
//   - Boundary arithmetic: N/A — no numeric ranges.
//   - Tenant isolation: N/A — single-user desktop shell.
//   - Encoding/locale: N/A — fixed English copy for now.
//   - Idempotency: connectOutlook always returns a fresh mock session.

describe("settingsModel", () => {
  it("[critical] exposes Outlook as the only connectable account for now", () => {
    const outlook = accountCatalog.find((account) => account.id === "outlook");
    const others = accountCatalog.filter((account) => account.id !== "outlook");

    expect(outlook?.availability).toBe("available");
    expect(
      others.every((account) => account.availability === "comingSoon"),
    ).toBe(true);
  });

  it("starts with no connected accounts", () => {
    expect(initialConnectedAccounts).toEqual({});
  });

  it("creates a mock Outlook session on connect", () => {
    expect(connectOutlook()).toEqual({
      email: "you@company.com",
      connectedAt: "Just now",
    });
  });

  it("defaults desktop always-on-top on and launch-at-login off", () => {
    expect(initialDesktopPreferences).toEqual({
      launchAtLogin: false,
      alwaysOnTop: true,
    });
  });

  it("defaults badge sources on and quiet hours off", () => {
    expect(initialNotificationPreferences.quietHours).toBe(false);
    expect(initialNotificationPreferences.badgeForEmail).toBe(true);
    expect(initialNotificationPreferences.osNotifications).toBe(false);
  });
});
