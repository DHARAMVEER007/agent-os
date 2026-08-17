"""Notification persistence and seed data."""

from __future__ import annotations

import json
import sqlite3
from typing import Any


SEED_NOTIFICATIONS: list[dict[str, Any]] = [
    {
        "id": 1,
        "source": "Email",
        "severity": "normal",
        "action": "approveReply",
        "title": "Reply ready for review",
        "detail": "Draft response to Maya about the project timeline.",
        "time_label": "Now",
        "is_read": False,
        "reply_draft": {
            "from": "maya@company.com",
            "to": "you@company.com",
            "subject": "Re: Project timeline",
            "originalSnippet": (
                "Can we move the AgentOS demo to Thursday and share the "
                "revised plan?"
            ),
            "draftBody": (
                "Hi Maya,\n\nThursday works on my side. I’ll send the revised "
                "plan by Wednesday EOD and include the open questions from the "
                "design review.\n\nThanks,\nYou"
            ),
            "validationNote": "Sender matched a trusted contact.",
        },
    },
    {
        "id": 2,
        "source": "Email",
        "severity": "normal",
        "action": "none",
        "title": "Invoice needs approval",
        "detail": "Northwind Traders sent invoice #4821 for review.",
        "time_label": "2m",
        "is_read": False,
        "reply_draft": None,
    },
    {
        "id": 3,
        "source": "Calendar",
        "severity": "normal",
        "action": "none",
        "title": "Meeting starts in 20 minutes",
        "detail": "AgentOS product planning",
        "time_label": "10m",
        "is_read": False,
        "reply_draft": None,
    },
    {
        "id": 4,
        "source": "Email",
        "severity": "warning",
        "action": "none",
        "title": "Sender could not be validated",
        "detail": "No reply was drafted for finance@unknown-domain.test.",
        "time_label": "25m",
        "is_read": False,
        "reply_draft": None,
    },
    {
        "id": 5,
        "source": "Teams",
        "severity": "normal",
        "action": "none",
        "title": "Priya mentioned you",
        "detail": "In #product-design",
        "time_label": "40m",
        "is_read": False,
        "reply_draft": None,
    },
    {
        "id": 6,
        "source": "GitHub",
        "severity": "normal",
        "action": "none",
        "title": "Review requested",
        "detail": "agent-os#31 adds the floating panel shell.",
        "time_label": "1h",
        "is_read": False,
        "reply_draft": None,
    },
    {
        "id": 7,
        "source": "Calendar",
        "severity": "normal",
        "action": "none",
        "title": "Tomorrow starts early",
        "detail": "Design review moved to 08:30.",
        "time_label": "1h",
        "is_read": False,
        "reply_draft": None,
    },
    {
        "id": 8,
        "source": "Email",
        "severity": "normal",
        "action": "none",
        "title": "Three messages are waiting",
        "detail": "Aditya, Sam, and Lena have replies pending since yesterday.",
        "time_label": "2h",
        "is_read": False,
        "reply_draft": None,
    },
    {
        "id": 9,
        "source": "Jira",
        "severity": "normal",
        "action": "none",
        "title": "VIR-2184 assigned to you",
        "detail": "Panel should stay inside the work area on small displays.",
        "time_label": "3h",
        "is_read": False,
        "reply_draft": None,
    },
    {
        "id": 10,
        "source": "Slack",
        "severity": "normal",
        "action": "none",
        "title": "Build finished",
        "detail": "AgentOS desktop 0.1.0 is ready to test.",
        "time_label": "4h",
        "is_read": False,
        "reply_draft": None,
    },
    {
        "id": 11,
        "source": "System",
        "severity": "normal",
        "action": "none",
        "title": "Rajveer is ready",
        "detail": "Your desktop companion is running.",
        "time_label": "Yesterday",
        "is_read": True,
        "reply_draft": None,
    },
    {
        "id": 12,
        "source": "System",
        "severity": "normal",
        "action": "none",
        "title": "Position restored",
        "detail": "The widget returned to where you left it.",
        "time_label": "Yesterday",
        "is_read": True,
        "reply_draft": None,
    },
]


def _row_to_notification(row: sqlite3.Row) -> dict[str, Any]:
    reply_raw = row["reply_draft_json"]
    return {
        "id": row["id"],
        "source": row["source"],
        "severity": row["severity"],
        "action": row["action"],
        "title": row["title"],
        "detail": row["detail"],
        "time": row["time_label"],
        "isRead": bool(row["is_read"]),
        "replyDraft": json.loads(reply_raw) if reply_raw else None,
    }


def seed_if_empty(connection: sqlite3.Connection) -> None:
    existing = connection.execute("SELECT COUNT(*) AS count FROM notifications")
    if existing.fetchone()["count"] > 0:
        return

    connection.executemany(
        """
        INSERT INTO notifications (
            id, source, severity, action, title, detail, time_label,
            is_read, reply_draft_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                item["id"],
                item["source"],
                item["severity"],
                item["action"],
                item["title"],
                item["detail"],
                item["time_label"],
                1 if item["is_read"] else 0,
                json.dumps(item["reply_draft"]) if item["reply_draft"] else None,
            )
            for item in SEED_NOTIFICATIONS
        ],
    )
    connection.commit()


def list_notifications(connection: sqlite3.Connection) -> list[dict[str, Any]]:
    rows = connection.execute(
        """
        SELECT id, source, severity, action, title, detail, time_label,
               is_read, reply_draft_json
        FROM notifications
        ORDER BY id ASC
        """
    ).fetchall()
    return [_row_to_notification(row) for row in rows]


def count_unread(connection: sqlite3.Connection) -> int:
    row = connection.execute(
        "SELECT COUNT(*) AS count FROM notifications WHERE is_read = 0"
    ).fetchone()
    return int(row["count"])


def mark_read(connection: sqlite3.Connection, notification_id: int) -> bool:
    cursor = connection.execute(
        "UPDATE notifications SET is_read = 1 WHERE id = ?",
        (notification_id,),
    )
    connection.commit()
    return cursor.rowcount > 0


def mark_all_read(connection: sqlite3.Connection) -> int:
    cursor = connection.execute(
        "UPDATE notifications SET is_read = 1 WHERE is_read = 0"
    )
    connection.commit()
    return cursor.rowcount


def update_reply_draft(
    connection: sqlite3.Connection,
    notification_id: int,
    subject: str,
    draft_body: str,
) -> bool:
    row = connection.execute(
        "SELECT reply_draft_json FROM notifications WHERE id = ?",
        (notification_id,),
    ).fetchone()
    if row is None or not row["reply_draft_json"]:
        return False

    draft = json.loads(row["reply_draft_json"])
    draft["subject"] = subject
    draft["draftBody"] = draft_body
    connection.execute(
        "UPDATE notifications SET reply_draft_json = ? WHERE id = ?",
        (json.dumps(draft), notification_id),
    )
    connection.commit()
    return True
