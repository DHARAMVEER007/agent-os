import { describe, expect, it } from "vitest";

import type { AgentNotification } from "./mockNotifications";
import {
  countUnread,
  markAllRead,
  markRead,
  mockNotifications,
  selectRead,
  selectUnread,
} from "./mockNotifications";

// Edge categories for the notification helpers:
//   - Null/undefined: N/A — the helpers take a required array and a required id.
//   - Empty collection: covered by the empty-list cases.
//   - Error path: N/A — an unknown id is a no-op by design, asserted below.
//   - External failure: N/A — pure functions over in-memory data.
//   - Concurrency: N/A — called from React state updates on one thread.
//   - Boundary arithmetic: covered by the unread-count boundary cases.
//   - Tenant isolation: N/A — no tenant-scoped data in the desktop shell.
//   - Encoding/locale: N/A — no formatting or parsing here.
//   - Idempotency: covered by "marking an already read notification".

function notification(id: number, isRead: boolean): AgentNotification {
  return {
    id,
    source: "Email",
    severity: "normal",
    title: `Message ${id}`,
    detail: "Detail",
    time: "Now",
    isRead,
  };
}

describe("countUnread", () => {
  it("[critical] counts only unread notifications", () => {
    expect(countUnread([])).toBe(0);
    expect(countUnread([notification(1, true)])).toBe(0);
    expect(countUnread([notification(1, false), notification(2, true)])).toBe(
      1,
    );
    expect(countUnread([notification(1, false), notification(2, false)])).toBe(
      2,
    );
  });

  it("leaves the mock data with both unread and read entries to look at", () => {
    expect(countUnread(mockNotifications)).toBeGreaterThan(0);
    expect(selectRead(mockNotifications).length).toBeGreaterThan(0);
  });
});

describe("selectUnread and selectRead", () => {
  it("[critical] split a list without losing or duplicating an entry", () => {
    const notifications = [
      notification(1, false),
      notification(2, true),
      notification(3, false),
    ];

    expect(selectUnread(notifications).map((item) => item.id)).toEqual([1, 3]);
    expect(selectRead(notifications).map((item) => item.id)).toEqual([2]);
  });

  it("handles a list where every entry falls on one side", () => {
    const unread = [notification(1, false)];
    const read = [notification(2, true)];

    expect(selectUnread(read)).toEqual([]);
    expect(selectRead(unread)).toEqual([]);
  });

  it("handles an empty list", () => {
    expect(selectUnread([])).toEqual([]);
    expect(selectRead([])).toEqual([]);
  });
});

describe("markRead", () => {
  it("[critical] marks only the requested notification", () => {
    const result = markRead(
      [notification(1, false), notification(2, false)],
      1,
    );

    expect(result.map((item) => item.isRead)).toEqual([true, false]);
  });

  it("leaves an unknown id untouched", () => {
    const notifications = [notification(1, false)];

    expect(markRead(notifications, 99)).toEqual(notifications);
  });

  it("is idempotent for an already read notification", () => {
    const once = markRead([notification(1, false)], 1);

    expect(markRead(once, 1)).toEqual(once);
  });

  it("does not mutate the notifications it was given", () => {
    const notifications = [notification(1, false)];

    markRead(notifications, 1);

    expect(notifications[0].isRead).toBe(false);
  });

  it("handles an empty list", () => {
    expect(markRead([], 1)).toEqual([]);
  });
});

describe("markAllRead", () => {
  it("[critical] leaves nothing unread", () => {
    const result = markAllRead([
      notification(1, false),
      notification(2, true),
      notification(3, false),
    ]);

    expect(countUnread(result)).toBe(0);
  });

  it("handles an empty list", () => {
    expect(markAllRead([])).toEqual([]);
  });
});
