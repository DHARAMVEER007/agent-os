"""Dev/demo producer that inserts unread notifications on an interval."""

from __future__ import annotations

import asyncio
import logging
import os
from typing import TYPE_CHECKING

from agentos.persistence import notifications as repo

if TYPE_CHECKING:
    from fastapi import FastAPI

logger = logging.getLogger(__name__)


def simulate_interval_seconds() -> float:
    raw = os.environ.get("AGENTOS_SIMULATE_INTERVAL_SECONDS", "30")
    try:
        return max(0.0, float(raw))
    except ValueError:
        return 30.0


async def run_notification_simulator(app: FastAPI) -> None:
    interval = simulate_interval_seconds()
    if interval <= 0:
        logger.info("notification simulator disabled")
        return

    logger.info("notification simulator every %.1fs", interval)
    sequence = 0
    while True:
        await asyncio.sleep(interval)
        sequence += 1
        connection = app.state.db
        created = repo.insert_simulated_notification(connection, sequence)
        unread = repo.count_unread(connection)
        await app.state.events.broadcast(
            {
                "type": "notification.created",
                "notificationId": created["id"],
                "title": created["title"],
            }
        )
        await app.state.events.broadcast(
            {
                "type": "unread_count.changed",
                "unreadCount": unread,
            }
        )
