import type { ComponentType } from "react";

import {
  CalendarIcon,
  ChatIcon,
  ChipIcon,
  CodeIcon,
  HashIcon,
  MailIcon,
  TicketIcon,
} from "../../components/icons";
import type {
  AgentNotification,
  NotificationSource,
} from "./mockNotifications";

export type NotificationTone =
  "mint" | "lavender" | "amber" | "blue" | "plum" | "indigo" | "slate";

interface SourceAppearance {
  icon: ComponentType<{ className?: string }>;
  tone: NotificationTone;
}

const bySource: Record<NotificationSource, SourceAppearance> = {
  Email: { icon: MailIcon, tone: "mint" },
  Calendar: { icon: CalendarIcon, tone: "lavender" },
  Teams: { icon: ChatIcon, tone: "blue" },
  Slack: { icon: HashIcon, tone: "plum" },
  GitHub: { icon: CodeIcon, tone: "slate" },
  Jira: { icon: TicketIcon, tone: "indigo" },
  System: { icon: ChipIcon, tone: "slate" },
};

const unknownSource: SourceAppearance = { icon: ChipIcon, tone: "slate" };

function appearanceFor(source: NotificationSource): SourceAppearance {
  return bySource[source] ?? unknownSource;
}

export function iconFor(
  source: NotificationSource,
): ComponentType<{ className?: string }> {
  return appearanceFor(source).icon;
}

/// A warning outranks the source colour, so anything the user needs to look at
/// twice reads as amber wherever it came from.
export function toneFor(notification: AgentNotification): NotificationTone {
  return notification.severity === "warning"
    ? "amber"
    : appearanceFor(notification.source).tone;
}
