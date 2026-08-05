export type NotificationSource =
  "Email" | "Calendar" | "Teams" | "Slack" | "GitHub" | "Jira" | "System";

/// `warning` marks activity the user should look at before acting on it, such
/// as a sender AgentOS could not validate.
export type NotificationSeverity = "normal" | "warning";

export interface AgentNotification {
  id: number;
  source: NotificationSource;
  severity: NotificationSeverity;
  title: string;
  detail: string;
  time: string;
  isRead: boolean;
}

/// Stand-in data until the background service produces real events. The list is
/// long enough to exercise scrolling and a two-digit unread badge, and includes
/// already-read entries so the read view is never empty on a first look.
export const mockNotifications: AgentNotification[] = [
  {
    id: 1,
    source: "Email",
    severity: "normal",
    title: "Reply ready for review",
    detail: "Draft response to Maya about the project timeline.",
    time: "Now",
    isRead: false,
  },
  {
    id: 2,
    source: "Email",
    severity: "normal",
    title: "Invoice needs approval",
    detail: "Northwind Traders sent invoice #4821 for review.",
    time: "2m",
    isRead: false,
  },
  {
    id: 3,
    source: "Calendar",
    severity: "normal",
    title: "Meeting starts in 20 minutes",
    detail: "AgentOS product planning",
    time: "10m",
    isRead: false,
  },
  {
    id: 4,
    source: "Email",
    severity: "warning",
    title: "Sender could not be validated",
    detail: "No reply was drafted for finance@unknown-domain.test.",
    time: "25m",
    isRead: false,
  },
  {
    id: 5,
    source: "Teams",
    severity: "normal",
    title: "Priya mentioned you",
    detail: "In #product-design",
    time: "40m",
    isRead: false,
  },
  {
    id: 6,
    source: "GitHub",
    severity: "normal",
    title: "Review requested",
    detail: "agent-os#31 adds the floating panel shell.",
    time: "1h",
    isRead: false,
  },
  {
    id: 7,
    source: "Calendar",
    severity: "normal",
    title: "Tomorrow starts early",
    detail: "Design review moved to 08:30.",
    time: "1h",
    isRead: false,
  },
  {
    id: 8,
    source: "Email",
    severity: "normal",
    title: "Three messages are waiting",
    detail: "Aditya, Sam, and Lena have replies pending since yesterday.",
    time: "2h",
    isRead: false,
  },
  {
    id: 9,
    source: "Jira",
    severity: "normal",
    title: "VIR-2184 assigned to you",
    detail: "Panel should stay inside the work area on small displays.",
    time: "3h",
    isRead: false,
  },
  {
    id: 10,
    source: "Slack",
    severity: "normal",
    title: "Build finished",
    detail: "AgentOS desktop 0.1.0 is ready to test.",
    time: "4h",
    isRead: false,
  },
  {
    id: 11,
    source: "System",
    severity: "normal",
    title: "Rajveer is ready",
    detail: "Your desktop companion is running.",
    time: "Yesterday",
    isRead: true,
  },
  {
    id: 12,
    source: "System",
    severity: "normal",
    title: "Position restored",
    detail: "The widget returned to where you left it.",
    time: "Yesterday",
    isRead: true,
  },
];

export function selectUnread(
  notifications: AgentNotification[],
): AgentNotification[] {
  return notifications.filter((notification) => !notification.isRead);
}

export function selectRead(
  notifications: AgentNotification[],
): AgentNotification[] {
  return notifications.filter((notification) => notification.isRead);
}

export function countUnread(notifications: AgentNotification[]): number {
  return selectUnread(notifications).length;
}

export function markRead(
  notifications: AgentNotification[],
  id: number,
): AgentNotification[] {
  return notifications.map((notification) =>
    notification.id === id ? { ...notification, isRead: true } : notification,
  );
}

export function markAllRead(
  notifications: AgentNotification[],
): AgentNotification[] {
  return notifications.map((notification) =>
    notification.isRead ? notification : { ...notification, isRead: true },
  );
}
