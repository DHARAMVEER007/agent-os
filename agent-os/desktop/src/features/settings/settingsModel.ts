import type { ComponentType } from "react";

import {
  CalendarIcon,
  ChatIcon,
  CodeIcon,
  HashIcon,
  MailIcon,
  TicketIcon,
} from "../../components/icons";

export type AccountId =
  "outlook" | "teams" | "jira" | "slack" | "github" | "calendar";

export type AccountAvailability = "available" | "comingSoon";

export interface ConnectedAccount {
  email?: string;
  connectedAt?: string;
}

export interface AccountDefinition {
  id: AccountId;
  name: string;
  description: string;
  availability: AccountAvailability;
  icon: ComponentType<{ className?: string }>;
  tone: "mint" | "lavender" | "blue" | "plum" | "indigo" | "slate";
}

export interface DesktopPreferences {
  launchAtLogin: boolean;
  alwaysOnTop: boolean;
}

export interface NotificationPreferences {
  quietHours: boolean;
  badgeForEmail: boolean;
  badgeForCalendar: boolean;
  badgeForChat: boolean;
  osNotifications: boolean;
}

export const accountCatalog: AccountDefinition[] = [
  {
    id: "outlook",
    name: "Microsoft Outlook",
    description: "Monitor inbox and draft replies for trusted senders.",
    availability: "available",
    icon: MailIcon,
    tone: "mint",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Mentions and direct messages from your work chats.",
    availability: "comingSoon",
    icon: ChatIcon,
    tone: "blue",
  },
  {
    id: "jira",
    name: "Jira",
    description: "Issues assigned to you or awaiting your review.",
    availability: "comingSoon",
    icon: TicketIcon,
    tone: "indigo",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Channel mentions and threads you care about.",
    availability: "comingSoon",
    icon: HashIcon,
    tone: "plum",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Pull-request reviews and repository activity.",
    availability: "comingSoon",
    icon: CodeIcon,
    tone: "slate",
  },
  {
    id: "calendar",
    name: "Calendar",
    description: "Upcoming meetings from Outlook or Google Calendar.",
    availability: "comingSoon",
    icon: CalendarIcon,
    tone: "lavender",
  },
];

export const initialConnectedAccounts: Partial<
  Record<AccountId, ConnectedAccount>
> = {};

export const initialNotificationPreferences: NotificationPreferences = {
  quietHours: false,
  badgeForEmail: true,
  badgeForCalendar: true,
  badgeForChat: true,
  osNotifications: false,
};

export const initialDesktopPreferences: DesktopPreferences = {
  launchAtLogin: false,
  alwaysOnTop: true,
};

export function connectOutlook(): ConnectedAccount {
  return {
    email: "you@company.com",
    connectedAt: "Just now",
  };
}
