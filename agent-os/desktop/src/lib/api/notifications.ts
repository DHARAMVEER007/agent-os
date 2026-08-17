import { getRuntimeConnection } from "../tauri/runtime";
import type {
  AgentNotification,
  ReplyDraft,
} from "../../features/notifications/mockNotifications";
import { mockNotifications } from "../../features/notifications/mockNotifications";

interface NotificationsResponse {
  notifications: AgentNotification[];
  unreadCount: number;
}

async function serviceFetch(
  path: string,
  init?: RequestInit,
): Promise<Response | null> {
  const connection = await getRuntimeConnection();
  if (!connection.ready || !connection.baseUrl || !connection.token) {
    return null;
  }

  return fetch(`${connection.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${connection.token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function normalizeNotification(
  notification: AgentNotification,
): AgentNotification {
  return {
    ...notification,
    replyDraft: notification.replyDraft ?? undefined,
  };
}

/// Loads notifications from the Python sidecar when it is ready; otherwise
/// falls back to the in-memory mock list used by browser previews and tests.
export async function loadNotifications(): Promise<AgentNotification[]> {
  const response = await serviceFetch("/v1/notifications");
  if (!response?.ok) {
    return mockNotifications;
  }

  const payload = (await response.json()) as NotificationsResponse;
  return payload.notifications.map(normalizeNotification);
}

export async function markNotificationReadRemote(
  id: number,
): Promise<AgentNotification[] | null> {
  const response = await serviceFetch(`/v1/notifications/${id}/read`, {
    method: "POST",
  });
  if (!response?.ok) {
    return null;
  }

  return loadNotifications();
}

export async function markAllNotificationsReadRemote(): Promise<
  AgentNotification[] | null
> {
  const response = await serviceFetch("/v1/notifications/read-all", {
    method: "POST",
  });
  if (!response?.ok) {
    return null;
  }

  return loadNotifications();
}

export async function saveReplyDraftRemote(
  id: number,
  draft: Pick<ReplyDraft, "subject" | "draftBody">,
): Promise<AgentNotification[] | null> {
  const response = await serviceFetch(`/v1/notifications/${id}/reply-draft`, {
    method: "PUT",
    body: JSON.stringify({
      subject: draft.subject,
      draftBody: draft.draftBody,
    }),
  });
  if (!response?.ok) {
    return null;
  }

  return loadNotifications();
}
