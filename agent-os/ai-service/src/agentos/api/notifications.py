"""Notification HTTP routes."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from agentos.api.auth import require_session_token
from agentos.persistence import notifications as repo

router = APIRouter(
    prefix="/v1/notifications",
    dependencies=[Depends(require_session_token)],
)


class ReplyDraftUpdate(BaseModel):
    subject: str = Field(min_length=1)
    draft_body: str = Field(alias="draftBody", min_length=1)

    model_config = {"populate_by_name": True}


def _connection(request: Request):
    return request.app.state.db


async def _publish(request: Request, event: dict[str, Any]) -> None:
    await request.app.state.events.broadcast(event)


@router.get("")
def list_notifications(request: Request) -> dict[str, Any]:
    connection = _connection(request)
    items = repo.list_notifications(connection)
    return {
        "notifications": items,
        "unreadCount": repo.count_unread(connection),
    }


@router.post("/read-all")
async def mark_all_notifications_read(request: Request) -> dict[str, Any]:
    connection = _connection(request)
    updated = repo.mark_all_read(connection)
    await _publish(
        request,
        {"type": "notification.updated", "scope": "all"},
    )
    await _publish(
        request,
        {"type": "unread_count.changed", "unreadCount": 0},
    )
    return {
        "updated": updated,
        "unreadCount": 0,
    }


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    request: Request,
) -> dict[str, Any]:
    connection = _connection(request)
    if not repo.mark_read(connection, notification_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    unread = repo.count_unread(connection)
    await _publish(
        request,
        {
            "type": "notification.updated",
            "notificationId": notification_id,
            "isRead": True,
        },
    )
    await _publish(
        request,
        {"type": "unread_count.changed", "unreadCount": unread},
    )
    return {
        "id": notification_id,
        "isRead": True,
        "unreadCount": unread,
    }


@router.put("/{notification_id}/reply-draft")
async def update_notification_reply_draft(
    notification_id: int,
    body: ReplyDraftUpdate,
    request: Request,
) -> dict[str, Any]:
    connection = _connection(request)
    if not repo.update_reply_draft(
        connection,
        notification_id,
        body.subject,
        body.draft_body,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply draft not found",
        )
    items = {
        item["id"]: item for item in repo.list_notifications(connection)
    }
    await _publish(
        request,
        {
            "type": "notification.updated",
            "notificationId": notification_id,
        },
    )
    return {"notification": items[notification_id]}
